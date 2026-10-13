import type { SupabaseClient } from '@supabase/supabase-js'
import { BUCKET } from './catalog'
export async function signedImage(client:SupabaseClient,path:string|null):Promise<string|null>{
 if(!path)return null
 const {data,error}=await client.storage.from(BUCKET).createSignedUrl(path,1800)
 return error?null:data.signedUrl
}
export async function uploadImage(client:SupabaseClient,userId:string,file:File):Promise<string>{
 if(file.size>5*1024*1024||file.size===0)throw new Error('A imagem precisa ter até 5 MB.')
 const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
 const ext=extensions[file.type]
 if(!ext)throw new Error('Aceitamos apenas JPG, PNG ou WebP.')
 const path=userId+'/'+crypto.randomUUID()+'.'+ext
 const {error}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'})
 if(error)throw error
 return path
}
