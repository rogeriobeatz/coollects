import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES } from '@/lib/photo-limits'
import { parseKieSuggestion } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mimeHeader(data: Uint8Array): string | null {
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg'
  if (data.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v)) return 'image/png'
  if (data.length >= 12 && String.fromCharCode(...data.slice(0,4)) === 'RIFF' && String.fromCharCode(...data.slice(8,12)) === 'WEBP') return 'image/webp'
  return null
}

export async function POST(request: Request) {
  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Faça login novamente.' }, { status: 401 })

  const form = await request.formData()
  const image = form.get('image')
  if (!(image instanceof File) || image.size === 0 || image.size > MAX_PHOTO_BYTES)
    return NextResponse.json({ error: 'A imagem deve ter no máximo 600 KB.' }, { status: 400 })

  const bytes = new Uint8Array(await image.arrayBuffer())
  const mime = mimeHeader(bytes)
  if (!mime) return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WebP.' }, { status: 400 })
  const imageHash = createHash('sha256').update(bytes).digest('hex')

  const { data: cached, error: cacheError } = await db.from('recognition_cache')
    .select('suggestion,raw_response').eq('owner_id',user.id).eq('image_sha256',imageHash).maybeSingle()
  if (cacheError) return NextResponse.json({ error: 'Não foi possível recuperar a análise.' }, { status: 503 })
  if (cached?.suggestion) return NextResponse.json({ status:'completed', suggestion:cached.suggestion, cached:true })
  if (cached?.raw_response) {
    try {
      const suggestion=parseKieSuggestion(cached.raw_response)
      await db.from('recognition_cache').update({suggestion,status:'completed',updated_at:new Date().toISOString()}).eq('owner_id',user.id).eq('image_sha256',imageHash)
      return NextResponse.json({status:'completed',suggestion,cached:true})
    } catch {
      return NextResponse.json({error:'A resposta anterior foi preservada, mas não pôde ser interpretada. Tente novamente mais tarde.'},{status:422})
    }
  }

  const { data: existing, error: existingError } = await db.from('recognition_jobs')
    .select('id,status,suggestion,attempts,raw_response').eq('owner_id',user.id).eq('image_sha256',imageHash).maybeSingle()
  if (existingError) return NextResponse.json({ error:'Não foi possível consultar a fila de análise.' },{status:503})
  if (existing?.status === 'completed' && existing.suggestion)
    return NextResponse.json({status:'completed',suggestion:existing.suggestion,cached:true})
  if (existing && ['queued','processing','retry_wait','waiting_user'].includes(existing.status))
    return NextResponse.json({status:existing.status,jobId:existing.id,attempts:existing.attempts})

  if(existing?.raw_response && existing.status==='failed') {
    const {data:recovered,error:recoverError}=await db.from('recognition_jobs').update({status:'queued',attempts:0,next_attempt_at:new Date().toISOString(),updated_at:new Date().toISOString(),last_error:null}).eq('id',existing.id).select('id,status,attempts').single()
    if(recoverError||!recovered)return NextResponse.json({error:'Não foi possível recuperar a análise anterior.'},{status:503})
    return NextResponse.json({status:recovered.status,jobId:recovered.id,attempts:recovered.attempts},{status:202})
  }
  const base64 = Buffer.from(bytes).toString('base64')
  const { data: job, error: insertError } = await db.from('recognition_jobs').upsert({
    owner_id:user.id,image_sha256:imageHash,mime_type:mime,image_base64:base64,
    status:'queued',attempts:0,next_attempt_at:new Date().toISOString(),last_error:null,
    raw_response:existing?.raw_response??null,suggestion:null,updated_at:new Date().toISOString()
  },{onConflict:'owner_id,image_sha256'}).select('id,status,attempts').single()
  if (insertError || !job) return NextResponse.json({error:'Não foi possível iniciar o reconhecimento.'},{status:503})
  return NextResponse.json({status:job.status,jobId:job.id,attempts:job.attempts},{status:202,headers:{'Cache-Control':'no-store'}})
}

export async function GET(request: Request) {
  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) return NextResponse.json({ error:'Faça login novamente.' },{status:401})
  const id = new URL(request.url).searchParams.get('jobId')
  if (!id) return NextResponse.json({error:'Análise não informada.'},{status:400})
  const {data:job,error}=await db.from('recognition_jobs')
    .select('id,status,suggestion,attempts,last_error,updated_at')
    .eq('id',id).eq('owner_id',user.id).maybeSingle()
  if(error||!job)return NextResponse.json({error:'Análise não encontrada.'},{status:404})
  return NextResponse.json(job,{headers:{'Cache-Control':'no-store'}})
}
