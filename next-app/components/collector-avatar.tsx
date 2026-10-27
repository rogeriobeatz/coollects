'use client'
import {useEffect,useState} from 'react'
import {avatarTone,initials} from '@/lib/social'
import {getBrowserClient} from '@/lib/supabase/client'

type Size='xs'|'sm'|'md'|'lg'
const AVATAR_BUCKET='coollects-avatars'
const cache=new Map<string,string|null>()
const pending=new Map<string,Promise<string|null>>()
export const AVATAR_UPDATED='coollects:avatar-updated'

async function lookup(seed:string):Promise<string|null>{
 if(cache.has(seed))return cache.get(seed)??null
 if(pending.has(seed))return pending.get(seed)!
 const task=(async()=>{
  const db=getBrowserClient()
  if(!db)return null
  const {data,error}=await db.from('profiles').select('avatar_path').eq('id',seed).maybeSingle()
  if(error||!data)return null
  const path=typeof data.avatar_path==='string'?data.avatar_path:''
  const url=path.startsWith(seed+'/')&&/^[-a-f0-9/]+\.(webp|jpg|png)$/i.test(path)?db.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl:null
  cache.set(seed,url)
  return url
 })().finally(()=>pending.delete(seed))
 pending.set(seed,task)
 return task
}
export function notifyAvatarUpdated(userId:string){
 cache.delete(userId)
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(AVATAR_UPDATED,{detail:userId}))
}
/** Shared across feed, profiles, comments and rail. Falls back to branded initials. */
export function CollectorAvatar({name,seed,size='md'}:{name:string;seed:string;size?:Size}){
 const [url,setUrl]=useState<string|null>(()=>cache.get(seed)??null)
 useEffect(()=>{
  let active=true
  void lookup(seed).then(next=>{if(active)setUrl(next)}).catch(()=>{})
  const changed=(event:Event)=>{
   if((event as CustomEvent<string>).detail!==seed)return
   void lookup(seed).then(next=>{if(active)setUrl(next)}).catch(()=>{})
  }
  window.addEventListener(AVATAR_UPDATED,changed)
  return ()=>{active=false;window.removeEventListener(AVATAR_UPDATED,changed)}
 },[seed])
 return <span className={'collector-avatar avatar-'+size+' avatar-'+avatarTone(seed)} aria-hidden="true">
  {url?<img src={url} alt="" loading="lazy" decoding="async" onError={()=>setUrl(null)}/>:initials(name)}
 </span>
}
