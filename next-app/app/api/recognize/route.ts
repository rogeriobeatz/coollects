import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
export const runtime='nodejs'
const result=z.object({
 name:z.string().max(90).optional().default(''),
 brand:z.string().max(70).optional().default(''),
 category:z.string().max(50).optional().default(''),
 notes:z.string().max(300).optional().default(''),
 visibleText:z.string().max(500).optional().default(''),
 confidence:z.enum(['low','medium','high']).optional().default('low'),
}).strip()
function recognizedMime(b:Uint8Array):string|null{
 if(b.length>3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg'
 if(b.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return 'image/png'
 if(b.length>12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp'
 return null
}
export async function POST(request:Request){
 const apiKey=process.env.GOOGLE_GENERATIVE_AI_API_KEY
 if(!apiKey)return NextResponse.json({error:'A leitura automática está temporariamente indisponível.'},{status:503})
 try{
  const supabase=await createSupabaseServerClient()
  const {data:{user},error:authError}=await supabase.auth.getUser()
  if(authError||!user)return NextResponse.json({error:'Faça login para usar o reconhecimento.'},{status:401})
  const form=await request.formData()
  const image=form.get('image')
  if(!(image instanceof File)||image.size===0||image.size>4*1024*1024)return NextResponse.json({error:'Envie uma imagem de até 4 MB.'},{status:400})
  const raw=new Uint8Array(await image.arrayBuffer())
  const mime=recognizedMime(raw)
  if(!mime)return NextResponse.json({error:'Formato inválido: use JPG, PNG ou WebP.'},{status:400})
  const {data:allowed,error:quotaError}=await supabase.rpc('consume_scan_quota')
  if(quotaError)return NextResponse.json({error:'Não foi possível iniciar o reconhecimento. Tente novamente mais tarde.'},{status:503})
  if(!allowed)return NextResponse.json({error:'Você atingiu o limite de 10 leituras de IA por dia.'},{status:429})
  const model=process.env.GEMINI_MODEL||'gemini-2.5-flash'
  if(!/^gemini-[a-z0-9.-]+$/.test(model))return NextResponse.json({error:'A leitura automática está indisponível.'},{status:500})
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
   body:JSON.stringify({
    contents:[{parts:[{text:'Você auxilia colecionadores brasileiros. Faça OCR e identificação visual deste item. Retorne somente JSON com os campos name, brand, category, notes, visibleText, confidence (low, medium, high). Extraia textos realmente visíveis. NÃO invente fabricante, modelo, ano, raridade ou edição. Se incerto, deixe campo vazio e confidence low. Categoria entre Miniaturas, Cartas, Tênis, Games, Quadrinhos, Discos, Action figures, Moedas, Outros. Respostas em português. Não inclua dados pessoais.'},{inlineData:{mimeType:mime,data:Buffer.from(raw).toString('base64')}}]}],
    generationConfig:{responseMimeType:'application/json',temperature:0.1}
   }),signal:AbortSignal.timeout(25000),cache:'no-store'
  })
  if(!response.ok)return NextResponse.json({error:'A IA está indisponível no momento. Preencha manualmente.'},{status:502})
  const payload=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}> }
  const content=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||''
  const resultData=result.safeParse(JSON.parse(content))
  if(!resultData.success)return NextResponse.json({error:'Resposta inválida da IA. Preencha manualmente.'},{status:502})
  return NextResponse.json({suggestion:resultData.data,disclaimer:'Sugestão automática: confira todos os dados antes de salvar.'},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.name==='TimeoutError'?'Tempo de reconhecimento esgotado.':'Não foi possível analisar a imagem.'},{status:500})}
}
