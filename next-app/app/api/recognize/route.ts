import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES } from '@/lib/photo-limits'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CHAT_URL = 'https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions'
const MODEL = 'gemini-3-8-flash'

type ChatPayload = {
  code?: number
  msg?: string
  choices?: { message?: { content?: string | { text?: string }[] } }[]
}
type CacheRow = {
  status: string
  raw_response: string | null
  suggestion: unknown
  updated_at: string
}

function mimeHeader(data: Uint8Array): string | null {
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg'
  if (data.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v)) return 'image/png'
  if (data.length >= 12 && String.fromCharCode(...data.slice(0,4)) === 'RIFF' && String.fromCharCode(...data.slice(8,12)) === 'WEBP') return 'image/webp'
  return null
}

function extractContent(payload: ChatPayload) {
  const raw = payload.choices?.[0]?.message?.content
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map(part => part.text || '').join('') : ''
}

function response(suggestion: unknown, trace: string, cached = false) {
  return NextResponse.json(
    { status: 'completed', suggestion, trace, cached, disclaimer: 'Confirme todos os dados antes de salvar.' },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

async function releaseReservation(db: Awaited<ReturnType<typeof createSupabaseServerClient>>, ownerId: string, imageHash: string, status: 'provider_error' | 'response_received', message: string) {
  await db.from('recognition_cache').update({
    status,
    error_stage: status === 'response_received' ? 'provider_outcome_unknown' : 'provider_rejected',
    error_message: message.slice(0, 500),
    updated_at: new Date().toISOString()
  }).eq('owner_id', ownerId).eq('image_sha256', imageHash).eq('status', 'processing')
}

export async function POST(request: Request) {
  const trace = crypto.randomUUID().slice(0, 8)
  const started = Date.now()
  const log = (stage: string, extra: Record<string, unknown> = {}) =>
    console.info('[KIE_VISION]', JSON.stringify({ trace, stage, ms: Date.now() - started, ...extra }))
  const fail = (stage: string, message: string, status: number) => {
    console.error('[KIE_VISION]', JSON.stringify({ trace, stage, status, ms: Date.now() - started }))
    return NextResponse.json({ error: message, trace }, { status, headers: { 'Cache-Control': 'no-store' } })
  }

  const key = process.env.KIE_API_KEY
  if (!key) return fail('CONFIG', 'Reconhecimento inteligente não configurado.', 503)

  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) return fail('AUTH', 'Faça login novamente para analisar a foto.', 401)

  let imageHash = ''
  let requestStarted = false
  try {
    const form = await request.formData()
    const image = form.get('image')
    if (!(image instanceof File) || image.size === 0 || image.size > MAX_PHOTO_BYTES)
      return fail('IMAGE_SIZE', 'A imagem para análise deve ter no máximo 600 KB.', 400)

    const bytes = new Uint8Array(await image.arrayBuffer())
    const mime = mimeHeader(bytes)
    if (!mime) return fail('IMAGE_TYPE', 'Formato inválido. Use JPG, PNG ou WebP.', 400)
    imageHash = createHash('sha256').update(bytes).digest('hex')

    const { data: cached, error: cacheReadError } = await db.from('recognition_cache')
      .select('status,raw_response,suggestion,updated_at')
      .eq('owner_id', user.id).eq('image_sha256', imageHash).maybeSingle<CacheRow>()
    if (cacheReadError) return fail('CACHE_READ', 'Não foi possível consultar o cache da análise.', 503)

    if (cached?.suggestion) return response(cached.suggestion, trace, true)
    if (cached?.raw_response) {
      try {
        const suggestion = parseKieSuggestion(cached.raw_response)
        const { error } = await db.from('recognition_cache').update({
          suggestion, status: 'completed', error_stage: null, error_message: null, updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash)
        if (error) return fail('CACHE_RECOVERY_SAVE', 'A resposta foi recuperada, mas não conseguimos salvar a ficha. Tente novamente.', 503)
        return response(suggestion, trace, true)
      } catch {
        await db.from('recognition_cache').update({
          status: 'parse_error', error_stage: 'parse_json',
          error_message: 'A resposta original foi preservada, mas não pôde ser interpretada.',
          updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash)
        return fail('PARSE_RECOVERABLE', 'A resposta original foi preservada, mas não pôde ser interpretada.', 422)
      }
    }

    if (cached?.status === 'processing') {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age > 120_000) {
        await db.from('recognition_cache').update({
          status: 'response_received', error_stage: 'stale_processing',
          error_message: 'A execução foi interrompida e o resultado do provedor não pôde ser confirmado.',
          updated_at: new Date().toISOString()
        }).eq('owner_id', user.id).eq('image_sha256', imageHash).eq('status', 'processing')
        return fail('OUTCOME_UNKNOWN', 'Não foi possível confirmar se a análise terminou. Para evitar uma cobrança duplicada, esta mesma foto não será reenviada automaticamente.', 409)
      }
      return fail('ALREADY_PROCESSING', 'Esta foto já está sendo analisada. Aguarde a resposta.', 409)
    }
    if (cached?.status === 'response_received' || cached?.status === 'response_received') {
      return fail('OUTCOME_UNKNOWN', 'Não foi possível confirmar o resultado anterior. A foto não será reenviada automaticamente para evitar uma possível cobrança duplicada.', 409)
    }

    // Atomic reservation: only the request that inserts (or conditionally resets
    // a definitive provider rejection) is allowed to contact KIE.
    let reserved = false
    if (!cached) {
      const { data, error } = await db.from('recognition_cache').upsert({
        owner_id: user.id, image_sha256: imageHash, status: 'processing',
        raw_response: null, suggestion: null, error_stage: null, error_message: null,
        model: MODEL, updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id,image_sha256', ignoreDuplicates: true }).select('id').maybeSingle()
      if (error) return fail('CACHE_RESERVE', 'Não foi possível reservar a análise. Nenhuma chamada foi feita à IA.', 503)
      reserved = Boolean(data?.id)
    } else if (cached.status === 'provider_error') {
      const { data, error } = await db.from('recognition_cache').update({
        status: 'processing', raw_response: null, suggestion: null,
        error_stage: null, error_message: null, updated_at: new Date().toISOString()
      }).eq('owner_id', user.id).eq('image_sha256', imageHash).eq('status', 'provider_error').select('id').maybeSingle()
      if (error) return fail('CACHE_RESERVE', 'Não foi possível reservar uma nova tentativa.', 503)
      reserved = Boolean(data?.id)
    }
    if (!reserved) {
      const { data: current } = await db.from('recognition_cache')
        .select('status').eq('owner_id', user.id).eq('image_sha256', imageHash).maybeSingle()
      return fail('DUPLICATE_BLOCKED', current?.status === 'processing'
        ? 'Esta foto já está sendo analisada. Aguarde a resposta.'
        : 'Já existe uma tentativa para esta foto. Não vamos reenviá-la automaticamente.', 409)
    }

    log('request_start', { model: MODEL, mime, bytes: bytes.length })
    requestStarted = true
    let providerResponse: Response
    try {
      providerResponse = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: false,
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: 'data:' + mime + ';base64,' + Buffer.from(bytes).toString('base64') } }
          ] }]
        }),
        signal: AbortSignal.timeout(50_000),
        cache: 'no-store'
      })
    } catch (error) {
      const timeout = error instanceof Error && error.name === 'TimeoutError'
      await releaseReservation(db, user.id, imageHash, 'response_received', timeout ? 'KIE_TIMEOUT' : 'KIE_NETWORK_ERROR')
      return fail(timeout ? 'KIE_TIMEOUT' : 'KIE_NETWORK_ERROR',
        'A conexão com a IA foi interrompida. Não é possível confirmar se o provedor processou a foto; ela não será reenviada automaticamente.', 504)
    }

    if (!providerResponse.ok) {
      const definitiveRejection = providerResponse.status >= 400 && providerResponse.status < 500 && providerResponse.status !== 408
      const status = definitiveRejection ? 'provider_error' : 'response_received'
      await releaseReservation(db, user.id, imageHash, status, 'KIE_HTTP_' + providerResponse.status)
      return fail('KIE_HTTP_' + providerResponse.status,
        definitiveRejection
          ? 'O serviço de IA recusou a solicitação. Você pode tentar novamente.'
          : 'O serviço de IA apresentou uma resposta incerta. Para evitar cobrança duplicada, não enviaremos a mesma foto novamente automaticamente.',
        providerResponse.status >= 500 ? 502 : 422)
    }

    const payload = await providerResponse.json().catch(() => null) as ChatPayload | null
    if (!payload) {
      await releaseReservation(db, user.id, imageHash, 'response_received', 'KIE_INVALID_JSON')
      return fail('KIE_INVALID_JSON', 'A IA respondeu em um formato inesperado. A foto não será reenviada automaticamente.', 502)
    }
    if (payload.code !== undefined && payload.code !== 200) {
      await releaseReservation(db, user.id, imageHash, 'provider_error', 'KIE_CODE_' + payload.code)
      return fail('KIE_CODE_' + payload.code, payload.msg || 'O serviço de IA recusou a solicitação. Você pode tentar novamente.', 422)
    }

    const rawResponse = extractContent(payload)
    if (!rawResponse) {
      await releaseReservation(db, user.id, imageHash, 'response_received', 'KIE_EMPTY_RESPONSE')
      return fail('KIE_EMPTY_RESPONSE', 'A IA respondeu sem conteúdo. Não vamos reenviar a mesma foto automaticamente.', 502)
    }

    const { error: persistError } = await db.from('recognition_cache').update({
      raw_response: rawResponse, status: 'response_received',
      error_stage: null, error_message: null, updated_at: new Date().toISOString()
    }).eq('owner_id', user.id).eq('image_sha256', imageHash).eq('status', 'processing')
    if (persistError) {
      await releaseReservation(db, user.id, imageHash, 'response_received', 'RAW_RESPONSE_PERSIST_FAILED')
      return fail('CACHE_PERSIST', 'A IA respondeu, mas não conseguimos confirmar o armazenamento do resultado. Não envie a mesma foto novamente ainda.', 503)
    }

    let suggestion: unknown
    try {
      suggestion = parseKieSuggestion(rawResponse)
    } catch {
      await db.from('recognition_cache').update({
        status: 'parse_error', error_stage: 'parse_json',
        error_message: 'A resposta foi recebida, mas não pôde ser interpretada.',
        updated_at: new Date().toISOString()
      }).eq('owner_id', user.id).eq('image_sha256', imageHash)
      return fail('PARSE_JSON', 'A IA respondeu e guardamos o resultado, mas houve um erro ao interpretar os campos. Tente novamente para recuperar sem chamar a IA outra vez.', 422)
    }

    const { error: completeError } = await db.from('recognition_cache').update({
      suggestion, status: 'completed', error_stage: null, error_message: null,
      updated_at: new Date().toISOString()
    }).eq('owner_id', user.id).eq('image_sha256', imageHash)
    if (completeError) return fail('CACHE_COMPLETE', 'A resposta foi preservada. Tente recuperar a análise sem reenviar a foto.', 503)

    log('completed', { model: MODEL })
    return response(suggestion, trace)
  } catch (error) {
    if (imageHash && requestStarted) {
      await releaseReservation(db, user.id, imageHash, 'response_received', error instanceof Error ? error.name : 'UNEXPECTED_ERROR')
    }
    log('unexpected_error', { error: error instanceof Error ? error.name : 'response_received' })
    return fail('UNEXPECTED', 'Não foi possível concluir a análise. A foto não será reenviada automaticamente.', 500)
  }
}
