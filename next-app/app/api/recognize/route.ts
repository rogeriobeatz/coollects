import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES } from '@/lib/photo-limits'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CHAT_URL = 'https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions'
const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-stream-upload'
const MODEL = 'gemini-3-8-flash'

function mimeHeader(data: Uint8Array): string | null {
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg'
  if (data.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => data[i] === v)) return 'image/png'
  if (data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' && String.fromCharCode(...data.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

class StageError extends Error {
  constructor(public stage: string, public userMessage: string, public status = 502) { super(stage) }
}

type ChatPayload = { code?: number; msg?: string; choices?: { message?: { content?: string | { text?: string }[] } }[] }
type CacheRow = { raw_response: string | null; suggestion: unknown; status: string; updated_at: string }

async function chat(key: string, imageUrl: string, fast: boolean, timeoutMs: number) {
  const body: Record<string, unknown> = {
    stream: false,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] }]
  }
  if (fast) body.reasoning_effort = 'low'
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store'
  })
  const payload = response.ok ? await response.json().catch(() => ({})) as ChatPayload : {} as ChatPayload
  return { status: response.status, ok: response.ok && (payload.code === undefined || payload.code === 200), payload }
}

async function uploadToKie(key: string, bytes: Uint8Array<ArrayBuffer>, mime: string) {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mime }), 'collectible-' + crypto.randomUUID() + '.' + ext)
  form.append('uploadPath', 'coollects/scans')
  const response = await fetch(UPLOAD_URL, {
    method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: form,
    signal: AbortSignal.timeout(12000), cache: 'no-store'
  })
  if (!response.ok) throw new StageError('KIE_UPLOAD_HTTP_' + response.status, 'Não foi possível enviar a imagem para análise.')
  const upload = await response.json() as { code?: number; data?: { downloadUrl?: string } }
  if (upload.code !== 200 || !upload.data?.downloadUrl) throw new StageError('KIE_UPLOAD_CODE_' + String(upload.code ?? 'UNKNOWN'), 'O serviço de imagens recusou o arquivo.')
  if (!/^https:\/\/[a-z0-9.-]+\//i.test(upload.data.downloadUrl)) throw new StageError('KIE_UPLOAD_URL', 'O serviço de imagens retornou um endereço inválido.')
  return upload.data.downloadUrl
}

function extractContent(payload: ChatPayload) {
  const raw = payload.choices?.[0]?.message?.content
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map(part => part.text || '').join('') : ''
}

function success(suggestion: unknown, trace: string, cached = false) {
  return NextResponse.json(
    { suggestion, trace, cached, disclaimer: 'Confirme todos os dados antes de salvar.' },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  const trace = crypto.randomUUID().slice(0, 8)
  const started = Date.now()
  const log = (event: Record<string, unknown>) => console.info('[KIE_VISION]', JSON.stringify({ trace, ms: Date.now() - started, ...event }))
  const failure = (stage: string, message: string, status: number) => {
    console.error('[KIE_VISION]', JSON.stringify({ trace, stage, status }))
    return NextResponse.json({ error: message, trace }, { status, headers: { 'Cache-Control': 'no-store' } })
  }

  let stage = 'config'
  const key = process.env.KIE_API_KEY
  if (!key) return failure('CONFIG', 'Reconhecimento inteligente não configurado.', 503)

  stage = 'auth'
  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) return failure('AUTH', 'Faça login novamente para analisar a foto.', 401)

  let imageHash = ''
  try {
    stage = 'image'
    const form = await request.formData()
    const image = form.get('image')
    if (!(image instanceof File) || image.size === 0 || image.size > MAX_PHOTO_BYTES) {
      return failure('IMAGE_SIZE', 'A imagem para análise deve ter no máximo 600 KB. Selecione a foto novamente.', 400)
    }
    const bytes = new Uint8Array(await image.arrayBuffer())
    const mime = mimeHeader(bytes)
    if (!mime) return failure('IMAGE_TYPE', 'Formato inválido. Use JPG, PNG ou WebP.', 400)
    imageHash = createHash('sha256').update(bytes).digest('hex')

    // A completed response is always reused. If parsing previously failed, retry
    // the parser against the stored provider text before spending another KIE call.
    stage = 'cache_lookup'
    const { data: cached, error: cacheReadError } = await db
      .from('recognition_cache')
      .select('raw_response,suggestion,status,updated_at')
      .eq('owner_id', user.id)
      .eq('image_sha256', imageHash)
      .maybeSingle<CacheRow>()
    if (cacheReadError) throw new StageError('CACHE_READ', 'Não foi possível recuperar a análise anterior. Nenhuma nova chamada foi feita ao serviço.', 503)

    if (cached?.suggestion) {
      log({ stage: 'cache_hit', cacheStatus: cached.status })
      return success(cached.suggestion, trace, true)
    }

    if (cached?.raw_response) {
      stage = 'cache_parse'
      try {
        const suggestion = parseKieSuggestion(cached.raw_response)
        const { error } = await db.from('recognition_cache').update({
          suggestion, status: 'completed', error_stage: null, error_message: null, updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash)
        if (error) throw new Error('cache-save')
        log({ stage: 'recovered_from_cache' })
        return success(suggestion, trace, true)
      } catch (error) {
        log({ stage: 'cached_parse_error', error: error instanceof Error ? error.name : 'unknown' })
        await db.from('recognition_cache').update({
          status: 'parse_error', error_stage: 'parse_json',
          error_message: 'A resposta original foi preservada, mas não pôde ser interpretada.',
          updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash)
        return failure('PARSE_RECOVERABLE', 'A resposta do reconhecimento foi preservada. Tente recuperar novamente; a foto não será enviada outra vez ao KIE.', 422)
      }
    }

    if (cached?.status === 'processing' && Date.now() - new Date(cached.updated_at).getTime() < 90_000) {
      return failure('ALREADY_PROCESSING', 'Esta foto já está em análise. Aguarde um instante para evitar uma chamada duplicada.', 409)
    }

    stage = 'cache_reserve'
    const { error: reserveError } = await db.from('recognition_cache').upsert({
      owner_id: user.id,
      image_sha256: imageHash,
      status: 'processing',
      raw_response: null,
      suggestion: null,
      error_stage: null,
      error_message: null,
      model: MODEL,
      updated_at: new Date().toISOString()
    }, { onConflict: 'owner_id,image_sha256' })
    if (reserveError) throw new StageError('CACHE_RESERVE', 'Não foi possível preparar a recuperação segura da análise. Nenhuma chamada foi feita ao KIE.', 503)

    // No generation, scan, or registration quota is enforced during development.

    stage = 'provider_request'
    let result: Awaited<ReturnType<typeof chat>> | null = null
    try {
      result = await chat(key, 'data:' + mime + ';base64,' + Buffer.from(bytes).toString('base64'), true, 18000)
      log({ stage: 'fast_path', status: result.status, ok: result.ok, code: result.payload.code })
    } catch (error) {
      log({ stage: 'fast_path_error', timeout: error instanceof Error && error.name === 'TimeoutError', error: error instanceof Error ? error.name : 'unknown' })
    }

    if (!result?.ok) {
      stage = 'kie_upload'
      const imageUrl = await uploadToKie(key, bytes, mime)
      stage = 'provider_request'
      try {
        result = await chat(key, imageUrl, false, 25000)
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          throw new StageError('KIE_TIMEOUT', 'A análise demorou além do limite de espera. O provedor pode ter processado a imagem; verifique novamente antes de solicitar outra análise.', 504)
        }
        throw error
      }
      log({ stage: 'fallback_path', status: result.status, ok: result.ok, code: result.payload.code })
      if (result.status >= 400) throw new StageError('KIE_HTTP_' + result.status, 'Não foi possível concluir a análise agora. Tente novamente em instantes.')
      if (!result.ok) throw new StageError('KIE_CODE_' + String(result.payload.code).slice(0, 5), 'O reconhecimento está temporariamente indisponível. Tente novamente em instantes.')
    }

    stage = 'provider_response'
    const rawResponse = extractContent(result.payload)
    if (!rawResponse) throw new StageError('EMPTY_RESPONSE', 'O serviço respondeu sem conteúdo reconhecível.')

    // Critical durability boundary: persist KIE's raw text BEFORE parsing or
    // returning anything to the browser. A UI/network/parser failure cannot lose it.
    const { error: persistError } = await db.from('recognition_cache').update({
      raw_response: rawResponse,
      status: 'response_received',
      error_stage: null,
      error_message: null,
      updated_at: new Date().toISOString()
    }).eq('owner_id', user.id).eq('image_sha256', imageHash)
    if (persistError) throw new StageError('CACHE_PERSIST', 'O KIE respondeu, mas não foi possível confirmar o armazenamento seguro do resultado. Não tente outra análise ainda; entre em contato com o suporte.', 503)

    stage = 'parse_json'
    let suggestion: unknown
    try {
      suggestion = parseKieSuggestion(rawResponse)
    } catch (error) {
      await db.from('recognition_cache').update({
        status: 'parse_error', error_stage: 'parse_json',
        error_message: error instanceof Error ? error.name : 'parse-error',
        updated_at: new Date().toISOString()
      }).eq('owner_id', user.id).eq('image_sha256', imageHash)
      throw new StageError('PARSE_JSON', 'A IA respondeu e o resultado foi guardado, mas houve um erro ao interpretar os campos. Tente recuperar a análise; não será necessário chamar o KIE novamente.', 422)
    }

    const { error: completeError } = await db.from('recognition_cache').update({
      suggestion, status: 'completed', error_stage: null, error_message: null, updated_at: new Date().toISOString()
    }).eq('owner_id', user.id).eq('image_sha256', imageHash)
    if (completeError) throw new StageError('CACHE_COMPLETE', 'A resposta original foi preservada. Tente recuperar a análise sem reenviar a foto.', 503)

    log({ stage: 'done', model: MODEL })
    return success(suggestion, trace)
  } catch (error) {
    if (error instanceof StageError) {
      if (imageHash && !['CACHE_READ', 'CACHE_RESERVE', 'CACHE_PERSIST', 'CACHE_COMPLETE', 'PARSE_JSON', 'PARSE_RECOVERABLE'].includes(error.stage)) {
        await db.from('recognition_cache').update({
          status: 'provider_error', error_stage: error.stage,
          error_message: error.userMessage, updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash)
      }
      return failure(error.stage, error.userMessage, error.status)
    }
    log({ stage, error: error instanceof Error ? error.name : 'unknown' })
    if (imageHash) {
      await db.from('recognition_cache').update({
        status: 'provider_error', error_stage: stage,
        error_message: error instanceof Error ? error.name : 'unknown',
        updated_at: new Date().toISOString()
      }).eq('owner_id', user.id).eq('image_sha256', imageHash)
    }
    return failure(stage.toUpperCase(), error instanceof Error && error.name === 'TimeoutError'
      ? 'A análise demorou além do limite de espera. O provedor pode ter processado a imagem; verifique novamente antes de solicitar outra análise.'
      : 'Não foi possível concluir a análise agora. Tente novamente em instantes.', 502)
  }
}
