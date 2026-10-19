import type { SupabaseClient } from '@supabase/supabase-js'
import { BUCKET } from './catalog'
import { MAX_PHOTO_BYTES } from './photo-limits'
const MIME_EXTENSIONS:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}

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

export async function signedImage(client:SupabaseClient,path:string|null):Promise<string|null>{
 if(!path)return null
 const {data,error}=await client.storage.from(BUCKET).createSignedUrl(path,120)
 return error?null:data.signedUrl
}
export async function uploadImage(client:SupabaseClient,userId:string,file:File):Promise<string>{
 const mime=await validateImageFile(file)
 const path=userId+'/'+crypto.randomUUID()+'.'+MIME_EXTENSIONS[mime]
 const {error}=await client.storage.from(BUCKET).upload(path,file,{contentType:mime,upsert:false,cacheControl:'120'})
 if(error)throw new Error('Não foi possível enviar a fotografia. Tente novamente.')
 return path
}
