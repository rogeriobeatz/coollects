import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

type Job = { id:string; owner_id:string; image_sha256:string; mime_type:string; image_base64:string; attempts:number }
type Payload = { code?:number; msg?:string; choices?:{message?:{content?:string|{text?:string}[]}}[] }

function extractContent(payload:Payload) {
  const raw=payload.choices?.[0]?.message?.content
  return typeof raw==='string'?raw:Array.isArray(raw)?raw.map(x=>x.text||'').join(''):''
}

export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET
  if(!secret||request.headers.get('authorization')!=='Bearer '+secret)
    return NextResponse.json({error:'Unauthorized'},{status:401})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY
  const kieKey=process.env.KIE_API_KEY
  if(!url||!serviceKey||!kieKey)return NextResponse.json({error:'Worker not configured'},{status:503})

  const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:claimed,error:claimError}=await db.rpc('claim_recognition_job')
  if(claimError)return NextResponse.json({error:'Queue claim failed'},{status:500})
  const job=(claimed as Job[]|null)?.[0]
  if(!job)return NextResponse.json({claimed:0})

  try {
    const response=await fetch('https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:'Bearer '+kieKey,'Content-Type':'application/json'},
      body:JSON.stringify({
        stream:false,
        messages:[{role:'user',content:[
          {type:'text',text:prompt},
          {type:'image_url',image_url:{url:'data:'+job.mime_type+';base64,'+job.image_base64}}
        ]}]
      }),
      signal:AbortSignal.timeout(110000),
      cache:'no-store'
    })
    if(!response.ok)throw new Error('KIE_HTTP_'+response.status)
    const payload=await response.json() as Payload
    if(payload.code!==undefined&&payload.code!==200)throw new Error('KIE_CODE_'+String(payload.code))
    const raw=extractContent(payload)
    if(!raw)throw new Error('KIE_EMPTY_RESPONSE')

    // Persist provider output before parsing; recovery never needs another KIE call.
    const {error:persistError}=await db.from('recognition_jobs')
      .update({raw_response:raw,updated_at:new Date().toISOString()})
      .eq('id',job.id).eq('status','processing')
    if(persistError)throw new Error('RAW_RESPONSE_PERSIST_FAILED')

    let suggestion
    try { suggestion=parseKieSuggestion(raw) }
    catch {
      await db.from('recognition_jobs').update({
        status:'failed',last_error:'A resposta foi recebida, mas não pôde ser interpretada.',
        image_base64:'',updated_at:new Date().toISOString()
      }).eq('id',job.id)
      return NextResponse.json({jobId:job.id,status:'failed',reason:'parse'})
    }

    const now=new Date().toISOString()
    const {error:doneError}=await db.from('recognition_jobs').update({
      status:'completed',suggestion,raw_response:raw,image_base64:'',
      last_error:null,updated_at:now
    }).eq('id',job.id).eq('status','processing')
    if(doneError)throw new Error('RESULT_PERSIST_FAILED')

    await db.from('recognition_cache').upsert({
      owner_id:job.owner_id,image_sha256:job.image_sha256,status:'completed',
      raw_response:raw,suggestion,model:'gemini-3-8-flash',updated_at:now
    },{onConflict:'owner_id,image_sha256'})
    return NextResponse.json({jobId:job.id,status:'completed',attempts:job.attempts})
  } catch(error) {
    const message=error instanceof Error?error.message:'PROVIDER_ERROR'
    const finalAttempt=job.attempts>10
    const nextStatus=finalAttempt?'failed':job.attempts>=10?'final_retry_wait':'retry_wait'
    const delayMs=job.attempts>=10?200000:15000
    await db.from('recognition_jobs').update({
      status:nextStatus,
      next_attempt_at:new Date(Date.now()+delayMs).toISOString(),
      last_error:message,
      image_base64:finalAttempt?'':job.image_base64,
      updated_at:new Date().toISOString()
    }).eq('id',job.id).eq('status','processing')
    return NextResponse.json({jobId:job.id,status:nextStatus,attempts:job.attempts})
  }
}
