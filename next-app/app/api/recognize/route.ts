import { NextResponse } from 'next/server'
import { parseKieSuggestion } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BUCKET } from '@/lib/catalog'
export const runtime='nodejs'
export const dynamic='force-dynamic'
function mimeHeader(data:Uint8Array):string|null {
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return'image/jpeg'
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v))return'image/png'
 if(data.length>=12&&String.fromCharCode(...data.slice(0,4))==='RIFF'&&String.fromCharCode(...data.slice(8,12))==='WEBP')return'image/webp'
 return null
}
export async function POST(request:Request){
 const trace=crypto.randomUUID().slice(0,8)
 const failure=(stage:string,message:string,status:number)=>{console.error('[KIE_VISION]',JSON.stringify({trace,stage,status}));return NextResponse.json({error:message+' (código '+stage+'-'+trace+')',stage,trace},{status})}
 let stage='config'
 const key=process.env.KIE_API_KEY
 if(!key)return failure('CONFIG','Reconhecimento inteligente não configurado.',503)
 stage='auth'
 const db=await createSupabaseServerClient()
 const {data:{user},error:authError}=await db.auth.getUser()
 if(authError||!user)return failure('AUTH','Faça login novamente para analisar a foto.',401)
 let temporary:string|undefined
 try{
  stage='image'
  const form=await request.formData(),image=form.get('image')
  if(!(image instanceof File)||image.size===0||image.size>4*1024*1024)return failure('IMAGE_SIZE','A IA aceita fotos de até 4 MB. Reabra a foto na galeria e tente novamente.',400)
  const bytes=new Uint8Array(await image.arrayBuffer()),mime=mimeHeader(bytes)
  if(!mime)return failure('IMAGE_TYPE','Formato inválido. Use JPG, PNG ou WebP.',400)
  stage='quota'
  const {data:allowed,error:quotaError}=await db.rpc('consume_scan_quota')
  if(quotaError)return failure('QUOTA_SERVICE','Não foi possível consultar o limite diário.',503)
  if(!allowed)return failure('QUOTA_LIMIT','Limite de 10 análises por dia atingido. O OCR local continua disponível.',429)
  stage='storage_upload'
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
  temporary=user.id+'/ai-temp-'+crypto.randomUUID()+'.'+ext
  const {error:uploadError}=await db.storage.from(BUCKET).upload(temporary,bytes,{contentType:mime,upsert:false})
  if(uploadError)throw new Error('temporary-upload-failed')
  stage='storage_signed_url'
  const {data:signed,error:signedError}=await db.storage.from(BUCKET).createSignedUrl(temporary,180)
  if(signedError||!signed?.signedUrl)throw new Error('signed-url-failed')
  stage='provider_request'
  const response=await fetch('https://api.kie.ai/gemini-3-flash/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({stream:false,messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:signed.signedUrl}}]}]}),signal:AbortSignal.timeout(45000),cache:'no-store'})
  if(!response.ok)return failure('KIE_HTTP_'+response.status,'O provedor recusou a análise da foto.',502)
  stage='provider_response'
  const payload=await response.json() as {code?:number;choices?:{message?:{content?:string|{text?:string}[]}}[]}
  if(payload.code&&payload.code!==200)return failure('KIE_CODE_'+String(payload.code).slice(0,5),'O provedor retornou um erro. Verifique os créditos e a disponibilidade do modelo.',502)
  const content=payload.choices?.[0]?.message?.content
  const text=typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):''
  if(!text)throw new Error('empty-response')
  stage='parse_json'
  const suggestion=parseKieSuggestion(text)
  return NextResponse.json({suggestion,trace,disclaimer:'Confirme todos os dados antes de salvar.'},{headers:{'Cache-Control':'no-store'}})
 }catch(e){console.error('[KIE_VISION]',JSON.stringify({trace,stage,error:e instanceof Error?e.name:'unknown'}));return failure(stage.toUpperCase(),e instanceof Error&&(e.name==='TimeoutError'||e.name==='TimeoutError')?'Tempo de análise esgotado.':'A análise falhou. O OCR local continua disponível.',502)}
 finally{if(temporary){try{await db.storage.from(BUCKET).remove([temporary])}catch{}}}
}
