import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BUCKET } from '@/lib/catalog'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const schema=z.object({name:z.string().max(90).optional().default(''),brand:z.string().max(70).optional().default(''),category:z.string().max(50).optional().default('Miniaturas'),notes:z.string().max(300).optional().default(''),visibleText:z.string().max(500).optional().default(''),confidence:z.enum(['low','medium','high']).optional().default('low')}).strip()
const prompt='Você cataloga colecionáveis brasileiros. Examine a foto de uma cartela ou embalagem e devolva SOMENTE JSON com name,brand,category,notes,visibleText,confidence (low,medium,high). Para Hot Wheels identifique nome do carro na faixa inferior, marca da MINIATURA, série, ano e numeração somente se realmente legíveis; coloque estes detalhes em notes. Exemplo: name Porsche 911 Carrera T; brand Hot Wheels; category Miniaturas. Não invente números nem edições. Transcreva apenas texto verificável em visibleText. Em caso de dúvida deixe campos vazios e confidence low. Categoria entre Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros.'
export function parseKieSuggestion(text:string){
 const cleaned=text.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')
 return schema.parse(JSON.parse(cleaned))
}
function mimeHeader(data:Uint8Array):string|null {
 if(data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255)return'image/jpeg'
 if(data.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>data[i]===v))return'image/png'
 if(data.length>=12&&String.fromCharCode(...data.slice(0,4))==='RIFF'&&String.fromCharCode(...data.slice(8,12))==='WEBP')return'image/webp'
 return null
}
export async function POST(request:Request){
 const key=process.env.KIE_API_KEY
 if(!key)return NextResponse.json({error:'Reconhecimento inteligente indisponível.'},{status:503})
 const db=await createSupabaseServerClient()
 const {data:{user},error:authError}=await db.auth.getUser()
 if(authError||!user)return NextResponse.json({error:'Faça login para analisar a foto.'},{status:401})
 let temporary:string|undefined
 try{
  const form=await request.formData(),image=form.get('image')
  if(!(image instanceof File)||image.size===0||image.size>4*1024*1024)return NextResponse.json({error:'Use uma foto de até 4 MB.'},{status:400})
  const bytes=new Uint8Array(await image.arrayBuffer()),mime=mimeHeader(bytes)
  if(!mime)return NextResponse.json({error:'Formato inválido. Use JPG, PNG ou WebP.'},{status:400})
  const {data:allowed,error:quotaError}=await db.rpc('consume_scan_quota')
  if(quotaError)return NextResponse.json({error:'Não foi possível consultar o limite diário.'},{status:503})
  if(!allowed)return NextResponse.json({error:'Limite de 10 análises por dia atingido. O OCR local continua disponível.'},{status:429})
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
  temporary=user.id+'/ai-temp-'+crypto.randomUUID()+'.'+ext
  const {error:uploadError}=await db.storage.from(BUCKET).upload(temporary,bytes,{contentType:mime,upsert:false})
  if(uploadError)throw new Error('temporary-upload-failed')
  const {data:signed,error:signedError}=await db.storage.from(BUCKET).createSignedUrl(temporary,180)
  if(signedError||!signed?.signedUrl)throw new Error('signed-url-failed')
  const response=await fetch('https://api.kie.ai/gemini-3-flash/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({stream:false,messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:signed.signedUrl}}]}]}),signal:AbortSignal.timeout(45000),cache:'no-store'})
  if(!response.ok)return NextResponse.json({error:'Serviço de IA indisponível. Use o OCR local.'},{status:502})
  const payload=await response.json() as {code?:number;choices?:{message?:{content?:string|{text?:string}[]}}[]}
  if(payload.code&&payload.code!==200)throw new Error('provider-rejected')
  const content=payload.choices?.[0]?.message?.content
  const text=typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join(''):''
  if(!text)throw new Error('empty-response')
  const suggestion=parseKieSuggestion(text)
  return NextResponse.json({suggestion,disclaimer:'Confirme todos os dados antes de salvar.'},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.name==='TimeoutError'?'Tempo de análise esgotado.':'Não foi possível analisar a foto. O OCR local continua disponível.'},{status:502})}
 finally{if(temporary){try{await db.storage.from(BUCKET).remove([temporary])}catch{}}}
}
