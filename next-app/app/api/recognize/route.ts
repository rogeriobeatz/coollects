import { NextResponse } from 'next/server'
import { MAX_PHOTO_BYTES } from '@/lib/photo-limits'
import { parseKieSuggestion, prompt } from '@/lib/kie-parser'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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
  stage='kie_upload'
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
  const uploadForm=new FormData()
  uploadForm.append('file',new Blob([bytes],{type:mime}),'collectible-'+crypto.randomUUID()+'.'+ext)
  uploadForm.append('uploadPath','coollects/scans')
  const uploadResponse=await fetch('https://kieai.redpandaai.co/api/file-stream-upload',{
   method:'POST',headers:{Authorization:'Bearer '+key},body:uploadForm,
   signal:AbortSignal.timeout(30000),cache:'no-store'
  })
  if(!uploadResponse.ok)return failure('KIE_UPLOAD_HTTP_'+uploadResponse.status,'Não foi possível enviar a imagem para análise.',502)
  const upload=await uploadResponse.json() as {code?:number;success?:boolean;msg?:string;data?:{downloadUrl?:string}}
  if(upload.code!==200||!upload.data?.downloadUrl)return failure('KIE_UPLOAD_CODE_'+String(upload.code??'UNKNOWN'),'O serviço de imagens recusou o arquivo.',502)
  const imageUrl=upload.data.downloadUrl
  if(!/^https:\/\/[a-z0-9.-]+\//i.test(imageUrl))return failure('KIE_UPLOAD_URL','O serviço de imagens retornou um endereço inválido.',502)
  stage='provider_request'
  console.info('[KIE_VISION]',JSON.stringify({trace,stage:'provider_request_start',model:'gemini-3-8-flash'}))
  const response=await fetch('https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({stream:false,messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:imageUrl}}]}]}),signal:AbortSignal.timeout(45000),cache:'no-store'})
  console.info('[KIE_VISION]',JSON.stringify({trace,stage:'provider_http',status:response.status}))
  if(!response.ok)return failure('KIE_HTTP_'+response.status,'O provedor recusou a análise da foto.',502)
  stage='provider_response'
  const payload=await response.json() as {code?:number;choices?:{message?:{content?:string|{text?:string}[]}}[]}
  if(payload.code!==undefined&&payload.code!==200)return failure('KIE_CODE_'+String(payload.code).slice(0,5),'O provedor retornou um erro. Verifique os créditos e a disponibilidade do modelo.',502)
  const content=payload.choices?.[0]?.message?.content
  const text=typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):''
  if(!text)throw new Error('empty-response')
  stage='parse_json'
  const suggestion=parseKieSuggestion(text)
  return NextResponse.json({suggestion,trace,disclaimer:'Confirme todos os dados antes de salvar.'},{headers:{'Cache-Control':'no-store'}})
 }catch(e){console.error('[KIE_VISION]',JSON.stringify({trace,stage,error:e instanceof Error?e.name:'unknown'}));return failure(stage.toUpperCase(),e instanceof Error&&(e.name==='TimeoutError'||e.name==='TimeoutError')?'Tempo de análise esgotado.':'A análise falhou. Você pode preencher manualmente.',502)}

}
