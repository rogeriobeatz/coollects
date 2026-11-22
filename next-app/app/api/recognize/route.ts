import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES } from '@/lib/photo-limits'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=60

const CHAT_URL='https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions'
const UPLOAD_URL='https://kieai.redpandaai.co/api/file-stream-upload'
const MODEL='gemini-3-8-flash'

function mimeHeader(data:Uint8Array):string|null {
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return'image/jpeg'
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v))return'image/png'
 if(data.length>=12&&String.fromCharCode(...data.slice(0,4))==='RIFF'&&String.fromCharCode(...data.slice(8,12))==='WEBP')return'image/webp'
 return null
}

class StageError extends Error{constructor(public stage:string,public userMessage:string,public status=502){super(stage)}}

type ChatPayload={code?:number;msg?:string;choices?:{message?:{content?:string|{text?:string}[]}}[]}

async function chat(key:string,imageUrl:string,fast:boolean,timeoutMs:number){
 const body:Record<string,unknown>={stream:false,messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:imageUrl}}]}]}
 // Less "thinking" = faster answer. Only sent on the fast path; the fallback
 // keeps the original request in case the provider rejects the parameter.
 if(fast)body.reasoning_effort='low'
 const response=await fetch(CHAT_URL,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(timeoutMs),cache:'no-store'})
 const payload=response.ok?await response.json().catch(()=>({})) as ChatPayload:{}
 return {status:response.status,ok:response.ok&&(payload.code===undefined||payload.code===200),payload}
}

/** Original path: store the image at KIE, then send its URL. Slower (two requests). */
async function uploadToKie(key:string,bytes:Uint8Array<ArrayBuffer>,mime:string){
 const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
 const form=new FormData()
 form.append('file',new Blob([bytes],{type:mime}),'collectible-'+crypto.randomUUID()+'.'+ext)
 form.append('uploadPath','coollects/scans')
 const response=await fetch(UPLOAD_URL,{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:AbortSignal.timeout(12000),cache:'no-store'})
 if(!response.ok)throw new StageError('KIE_UPLOAD_HTTP_'+response.status,'Não foi possível enviar a imagem para análise.')
 const upload=await response.json() as {code?:number;data?:{downloadUrl?:string}}
 if(upload.code!==200||!upload.data?.downloadUrl)throw new StageError('KIE_UPLOAD_CODE_'+String(upload.code??'UNKNOWN'),'O serviço de imagens recusou o arquivo.')
 if(!/^https:\/\/[a-z0-9.-]+\//i.test(upload.data.downloadUrl))throw new StageError('KIE_UPLOAD_URL','O serviço de imagens retornou um endereço inválido.')
 return upload.data.downloadUrl
}

export async function POST(request:Request){
 const trace=crypto.randomUUID().slice(0,8)
 const started=Date.now()
 const log=(event:Record<string,unknown>)=>console.info('[KIE_VISION]',JSON.stringify({trace,ms:Date.now()-started,...event}))
 const failure=(stage:string,message:string,status:number)=>{console.error('[KIE_VISION]',JSON.stringify({trace,stage,status}));return NextResponse.json({error:message,trace},{status,headers:{'Cache-Control':'no-store'}})}
 let stage='config'
 const key=process.env.KIE_API_KEY
 if(!key)return failure('CONFIG','Reconhecimento inteligente não configurado.',503)
 stage='auth'
 const db=await createSupabaseServerClient()
 const {data:{user},error:authError}=await db.auth.getUser()
 if(authError||!user)return failure('AUTH','Faça login novamente para analisar a foto.',401)
 try{
  stage='image'
  const form=await request.formData(),image=form.get('image')
  if(!(image instanceof File)||image.size===0||image.size>MAX_PHOTO_BYTES)return failure('IMAGE_SIZE','A imagem para análise deve ter no máximo 600 KB. Selecione a foto novamente.',400)
  const bytes=new Uint8Array(await image.arrayBuffer()),mime=mimeHeader(bytes)
  if(!mime)return failure('IMAGE_TYPE','Formato inválido. Use JPG, PNG ou WebP.',400)
  stage='quota'
  const {data:allowed,error:quotaError}=await db.rpc('consume_scan_quota')
  if(quotaError)return failure('QUOTA_SERVICE','Não foi possível consultar o limite diário.',503)
  if(!allowed)return failure('QUOTA_LIMIT','Limite de 10 análises por dia atingido. Você pode preencher manualmente.',429)

  // Fast path: image inline (no KIE storage round trip, photo not kept by KIE)
  // and low reasoning effort. If the provider rejects it quickly, fall back.
  stage='provider_request'
  let result:Awaited<ReturnType<typeof chat>>|null=null
  try{
   result=await chat(key,'data:'+mime+';base64,'+Buffer.from(bytes).toString('base64'),true,18000)
   log({stage:'fast_path',status:result.status,ok:result.ok,code:result.payload.code})
  }catch(error){
   // One bounded fallback prevents a transient inline failure from ending the capture.
   // There is no loop: quota is consumed once and the fallback runs at most once.
   log({stage:'fast_path_error',timeout:error instanceof Error&&error.name==='TimeoutError',error:error instanceof Error?error.name:'unknown'})
  }
  if(!result?.ok){
   stage='kie_upload'
   const imageUrl=await uploadToKie(key,bytes,mime)
   stage='provider_request'
   try{result=await chat(key,imageUrl,false,25000)}catch(error){
    if(error instanceof Error&&error.name==='TimeoutError')throw new StageError('KIE_TIMEOUT','A análise está demorando mais que o esperado. Tente novamente em instantes ou preencha os dados manualmente.',504)
    throw error
   }
   log({stage:'fallback_path',status:result.status,ok:result.ok,code:result.payload.code})
   if(result.status>=400)throw new StageError('KIE_HTTP_'+result.status,'Não foi possível concluir a análise agora. Tente novamente em instantes ou preencha os dados manualmente.')
   if(!result.ok)throw new StageError('KIE_CODE_'+String(result.payload.code).slice(0,5),'O reconhecimento está temporariamente indisponível. Tente novamente em instantes ou preencha os dados manualmente.')
  }
  stage='provider_response'
  const content=result.payload.choices?.[0]?.message?.content
  const text=typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):''
  if(!text)throw new Error('empty-response')
  stage='parse_json'
  const suggestion=parseKieSuggestion(text)
  log({stage:'done',model:MODEL})
  return NextResponse.json({suggestion,trace,disclaimer:'Confirme todos os dados antes de salvar.'},{headers:{'Cache-Control':'no-store'}})
 }catch(e){
  if(e instanceof StageError)return failure(e.stage,e.userMessage,e.status)
  console.error('[KIE_VISION]',JSON.stringify({trace,stage,error:e instanceof Error?e.name:'unknown'}))
  return failure(stage.toUpperCase(),e instanceof Error&&e.name==='TimeoutError'?'A análise está demorando mais que o esperado. Tente novamente em instantes ou preencha os dados manualmente.':'Não foi possível concluir a análise agora. Tente novamente em instantes ou preencha os dados manualmente.',502)
 }
}
