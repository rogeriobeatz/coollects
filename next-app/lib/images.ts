import type { SupabaseClient } from '@supabase/supabase-js'
import { BUCKET } from './catalog'
import { MAX_PHOTO_BYTES } from './photo-limits'
import { clearThumbs,getThumb,rememberThumb } from './image-cache'
const MIME_EXTENSIONS:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
/** Signed URLs last one hour, so photos do not break on pages left open. */
const SIGN_SECONDS=3600

export async function validateImageFile(file:File):Promise<string>{
 if(!file.size||file.size>MAX_PHOTO_BYTES)throw new Error('A fotografia precisa ter no máximo 600 KB após a preparação.')
 const declared=file.type.toLowerCase()
 if(!MIME_EXTENSIONS[declared])throw new Error('Aceitamos imagens JPG, PNG ou WebP.')
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer())
 const jpeg=bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255
 const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)
 const webp=bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'
 const detected=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':null
 if(detected!==declared)throw new Error('O arquivo não corresponde a uma fotografia válida.')
 return detected
}

// Per-session memory: one object URL per thumbnail, one signed URL per path.
const thumbUrls=new Map<string,string>()
const signedUrls=new Map<string,{url:string;until:number}>()
let cacheEpoch=0
// Wait for IndexedDB deletion before reading thumbnails for a new session.
let pendingClear:Promise<void>=Promise.resolve()

function freshSigned(path:string){
 const hit=signedUrls.get(path)
 return hit&&hit.until>Date.now()?hit.url:null
}
function keepSigned(path:string,url:string){signedUrls.set(path,{url,until:Date.now()+(SIGN_SECONDS-300)*1000})}

async function localThumb(path:string,epoch=cacheEpoch){
 const memory=thumbUrls.get(path)
 if(epoch!==cacheEpoch)return null
 if(memory)return memory
 const blob=await getThumb(path)
 if(epoch!==cacheEpoch||!blob)return null
 const url=URL.createObjectURL(blob)
 thumbUrls.set(path,url)
 return url
}

/**
 * Card-sized image for a Storage path. Uses the on-device copy when there is
 * one; otherwise signs the original and keeps a reduced copy for next time.
 * Pass full:true for detail views that need the original quality.
 */
export async function signedImage(client:SupabaseClient,path:string|null,options:{full?:boolean}={}):Promise<string|null>{
 const epoch=cacheEpoch
 if(!path)return null
 await pendingClear
 if(epoch!==cacheEpoch)return null
 if(!options.full){const local=await localThumb(path,epoch);if(epoch!==cacheEpoch)return null;if(local)return local}
 let url=freshSigned(path)
 if(!url){
  const {data,error}=await client.storage.from(BUCKET).createSignedUrl(path,SIGN_SECONDS)
  if(epoch!==cacheEpoch||error||!data?.signedUrl)return null
  url=data.signedUrl;keepSigned(path,url)
 }
 if(epoch!==cacheEpoch)return null
 rememberThumb(path,url)
 return url
}

/** Batch version for lists: one request signs every photo not cached yet. */
export async function signedImages(client:SupabaseClient,paths:(string|null|undefined)[]):Promise<Map<string,string>>{
 const epoch=cacheEpoch
 await pendingClear
 const result=new Map<string,string>()
 if(epoch!==cacheEpoch)return result
 const unique=[...new Set(paths.filter((path):path is string=>Boolean(path)))]
 const missing:string[]=[]
 await Promise.all(unique.map(async path=>{
  const url=await localThumb(path,epoch)??freshSigned(path)
  if(epoch!==cacheEpoch)return
  if(url)result.set(path,url);else missing.push(path)
 }))
 if(epoch!==cacheEpoch)return new Map()
 if(missing.length){
  try{
   for(let start=0;start<missing.length;start+=200){
   const {data}=await client.storage.from(BUCKET).createSignedUrls(missing.slice(start,start+200),SIGN_SECONDS)
   if(epoch!==cacheEpoch)return new Map()
   for(const photo of data||[])if(photo.path&&photo.signedUrl&&!photo.error){
    result.set(photo.path,photo.signedUrl);keepSigned(photo.path,photo.signedUrl);rememberThumb(photo.path,photo.signedUrl)
   }
   }
  }catch{/* A missing photo never blocks the list; cards show their placeholder. */}
 }
 return epoch===cacheEpoch?result:new Map()
}

/** Called at sign-out: removes on-device photo copies from this browser. */
export async function clearImageCache(){
 cacheEpoch++
 thumbUrls.forEach(url=>URL.revokeObjectURL(url))
 thumbUrls.clear();signedUrls.clear()
 const clear=pendingClear.then(()=>clearThumbs())
 pendingClear=clear
 await clear
}

export async function uploadImage(client:SupabaseClient,userId:string,file:File):Promise<string>{
 const mime=await validateImageFile(file)
 const path=userId+'/'+crypto.randomUUID()+'.'+MIME_EXTENSIONS[mime]
 const {error}=await client.storage.from(BUCKET).upload(path,file,{contentType:mime,upsert:false,cacheControl:'3600'})
 if(error)throw new Error('Não foi possível enviar a fotografia. Tente novamente.')
 return path
}
