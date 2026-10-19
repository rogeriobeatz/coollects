import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { createClient,type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './supabase/config'
import { BUCKET } from './catalog'

/** Link previews (WhatsApp, redes sociais) só leem dados públicos, sem sessão. */
export const OG_SIZE={width:1200,height:630}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function anon():SupabaseClient|null{
 const config=supabaseConfig()
 // Short timeout: a slow backend must never hold up the page itself.
 return config?createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(1500)})}}):null
}

export type CollectionPreview={name:string;description:string;owner:string;count:number;emoji:string;photos:string[]}
export type ItemPreview={name:string;brand:string;category:string;owner:string;series:string;photo:string|null}

/** Never wait more than this for preview data (the client library may retry). */
function withDeadline<T>(work:Promise<T|null>,ms=1800):Promise<T|null>{
 return Promise.race([work,new Promise<null>(resolve=>setTimeout(()=>resolve(null),ms))])
}

export function collectionPreview(id:string){return withDeadline(loadCollectionPreview(id))}
export function itemPreview(id:string){return withDeadline(loadItemPreview(id))}

async function loadCollectionPreview(id:string):Promise<CollectionPreview|null>{
 const db=anon();if(!db||!UUID.test(id))return null
 try{
  const {data:c}=await db.from('collections').select('name,description,emoji,owner_id,cover_item_id,is_public').eq('id',id).maybeSingle()
  if(!c||!c.is_public)return null
  const [{data:p},{data:links,count}]=await Promise.all([
   db.from('profiles').select('display_name,username').eq('id',c.owner_id).maybeSingle(),
   db.from('collection_items').select('item_id',{count:'exact'}).eq('collection_id',id).order('created_at',{ascending:true}).limit(12)
  ])
  const ids=(links||[]).map(l=>l.item_id as string)
  const ordered=c.cover_item_id&&ids.includes(c.cover_item_id)?[c.cover_item_id,...ids.filter(x=>x!==c.cover_item_id)]:ids
  let photos:string[]=[]
  if(ordered.length){
   const {data:items}=await db.from('items').select('id,photo_path').in('id',ordered)
   const byId=new Map((items||[]).map(i=>[i.id as string,i.photo_path as string|null]))
   photos=ordered.map(i=>byId.get(i)).filter((x):x is string=>Boolean(x)).slice(0,3)
  }
  return {name:c.name,description:c.description||'',owner:p?.display_name||p?.username||'',count:count??ids.length,emoji:c.emoji||'✨',photos}
 }catch{return null}
}

async function loadItemPreview(id:string):Promise<ItemPreview|null>{
 const db=anon();if(!db||!UUID.test(id))return null
 try{
  const {data:i}=await db.from('items').select('name,brand,category,owner_id,photo_path,details').eq('id',id).maybeSingle()
  if(!i)return null
  const {data:p}=await db.from('profiles').select('display_name,username').eq('id',i.owner_id).maybeSingle()
  const details=(i.details||{}) as Record<string,unknown>
  return {name:i.name,brand:i.brand||'',category:i.category,owner:p?.display_name||p?.username||'',series:typeof details.series==='string'?details.series:'',photo:i.photo_path}
 }catch{return null}
}

/** Photo as a JPEG data URI: the preview renderer cannot draw WebP. */
async function photoData(path:string,edge:number):Promise<string|null>{
 const db=anon();if(!db)return null
 try{
  const {data}=await db.storage.from(BUCKET).createSignedUrl(path,60)
  if(!data?.signedUrl)return null
  const response=await fetch(data.signedUrl,{signal:AbortSignal.timeout(6000)})
  if(!response.ok)return null
  const sharp=(await import('sharp')).default
  const jpeg=await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize(edge,edge,{fit:'cover'}).jpeg({quality:78}).toBuffer()
  return 'data:image/jpeg;base64,'+jpeg.toString('base64')
 }catch{return null}
}

async function fonts(){
 try{
  const [bold,light]=await Promise.all([
   readFile(join(process.cwd(),'public/brand/WorkSans-Bold.ttf')),
   readFile(join(process.cwd(),'public/brand/WorkSans-Light.ttf'))
  ])
  return [{name:'Work Sans',data:bold,weight:800 as const,style:'normal' as const},{name:'Work Sans',data:light,weight:400 as const,style:'normal' as const}]
 }catch{return undefined}
}

const PURPLE='#6125BF',ORANGE='#F15700'

function Frame({kicker,title,lines,photos,fallback}:{kicker:string;title:string;lines:string[];photos:string[];fallback:string}){
 const main=photos[0]
 return <div style={{display:'flex',width:'100%',height:'100%',background:PURPLE,fontFamily:'Work Sans',color:'#fff',padding:56,gap:48}}>
  <div style={{display:'flex',width:470,height:518,position:'relative'}}>
   {photos[1]&&<img src={photos[1]} width={300} height={300} style={{position:'absolute',right:0,top:0,borderRadius:28,transform:'rotate(6deg)',border:'6px solid #fff',objectFit:'cover'}}/>}
   {main
    ?<img src={main} width={400} height={400} style={{position:'absolute',left:0,bottom:0,borderRadius:32,border:'8px solid #fff',objectFit:'cover',transform:'rotate(-3deg)'}}/>
    :<div style={{display:'flex',alignItems:'center',justifyContent:'center',width:420,height:420,borderRadius:40,background:'#ffffff1f',fontSize:200,fontWeight:800,position:'absolute',left:0,bottom:20}}>{fallback}</div>}
  </div>
  <div style={{display:'flex',flexDirection:'column',flex:1,justifyContent:'center'}}>
   <div style={{display:'flex',fontSize:24,letterSpacing:6,color:'#ffd2b8',fontWeight:800}}>{kicker}</div>
   <div style={{display:'flex',fontSize:title.length>40?52:64,fontWeight:800,lineHeight:1.02,letterSpacing:-2,marginTop:18}}>{title}</div>
   {lines.filter(Boolean).map(line=><div key={line} style={{display:'flex',fontSize:28,marginTop:16,color:'#eadcff'}}>{line}</div>)}
   <div style={{display:'flex',alignItems:'center',marginTop:'auto',gap:14}}>
    <div style={{display:'flex',width:18,height:18,borderRadius:9,background:ORANGE}}/>
    <div style={{display:'flex',fontSize:34,fontWeight:800,letterSpacing:-1}}>coollects</div>
   </div>
  </div>
 </div>
}

export async function collectionImage(id:string){
 const data=await collectionPreview(id)
 const photos=data?(await Promise.all(data.photos.slice(0,2).map((p,i)=>photoData(p,i?300:400)))).filter((x):x is string=>Boolean(x)):[]
 return new ImageResponse(<Frame kicker="COLEÇÃO" title={data?.name||'Coleção no Coollects'} photos={photos} fallback={(data?.name||'C').trim().charAt(0).toUpperCase()}
  lines={data?[data.owner?'de '+data.owner:'',data.count+' '+(data.count===1?'item':'itens')]:['Suas coleções em um só lugar']}/>,{...OG_SIZE,fonts:await fonts()})
}

export async function itemImage(id:string){
 const data=await itemPreview(id)
 const photo=data?.photo?await photoData(data.photo,400):null
 return new ImageResponse(<Frame kicker={(data?.category||'ITEM').toUpperCase()} title={data?.name||'Item no Coollects'} photos={photo?[photo]:[]} fallback={(data?.name||'C').trim().charAt(0).toUpperCase()}
  lines={data?[[data.brand,data.series].filter(Boolean).join(' · '),data.owner?'do acervo de '+data.owner:'']:['Suas coleções em um só lugar']}/>,{...OG_SIZE,fonts:await fonts()})
}
