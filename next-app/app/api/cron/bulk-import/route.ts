import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type QueueItem = { id: string; photo_path: string; attempts: number; raw_response: string | null }
type Payload = { code?: number; msg?: string; choices?: { message?: { content?: string | { text?: string }[] } }[] }
const CHAT_URL = 'https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions'

function extractContent(payload: Payload) {
  const raw = payload.choices?.[0]?.message?.content
  return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map(part => part.text || '').join('') : ''
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const kieKey = process.env.KIE_API_KEY
  if (!url || !serviceKey || !kieKey) return NextResponse.json({ error: 'Worker not configured' }, { status: 503 })

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: items, error: claimError } = await db.rpc('claim_bulk_import_items', { p_limit: 2 })
  if (claimError) return NextResponse.json({ error: 'Queue claim failed' }, { status: 500 })

  const results = []
  for (const item of (items || []) as QueueItem[]) {
    try {
      let rawResponse = item.raw_response

      // A previous attempt may already have paid for KIE. Parse its durable
      // response first; never call the provider again while raw output exists.
      if (!rawResponse) {
        const { data: signed, error: signedError } = await db.storage
          .from('coollects-items').createSignedUrl(item.photo_path, 300)
        if (signedError || !signed?.signedUrl) throw new Error('Não foi possível acessar a foto armazenada.')

        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + kieKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stream: false,
            messages: [{ role: 'user', content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: signed.signedUrl } }
            ] }]
          }),
          signal: AbortSignal.timeout(25000),
          cache: 'no-store'
        })
        if (!response.ok) throw new Error('O serviço de reconhecimento retornou HTTP ' + response.status + '.')
        const payload = await response.json() as Payload
        if (payload.code !== undefined && payload.code !== 200) throw new Error(payload.msg || 'O serviço de reconhecimento recusou a imagem.')
        rawResponse = extractContent(payload)
        if (!rawResponse) throw new Error('O reconhecimento não retornou dados.')

        // Persist the raw provider output before parsing or changing queue state.
        const { error: persistError } = await db.from('bulk_import_items')
          .update({ raw_response: rawResponse, updated_at: new Date().toISOString() })
          .eq('id', item.id).eq('status', 'processing')
        if (persistError) throw new Error('A IA respondeu, mas não foi possível guardar o resultado original.')
      }

      const suggestion = parseKieSuggestion(rawResponse)
      const { error: finishError } = await db.rpc('finish_bulk_import_item', {
        p_item_id: item.id, p_suggestion: suggestion, p_error: null
      })
      if (finishError) throw new Error('Não foi possível registrar o resultado.')
      results.push({ id: item.id, status: 'ready', recovered: Boolean(item.raw_response) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha temporária no reconhecimento.'
      await db.rpc('finish_bulk_import_item', { p_item_id: item.id, p_suggestion: null, p_error: message })
      results.push({ id: item.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ claimed: items?.length || 0, processed: results }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
