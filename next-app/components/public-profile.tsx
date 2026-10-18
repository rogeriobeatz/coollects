'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import { ArrowRight,UserRound } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ProfileRow,collectionUrlPath,safeColor } from '@/lib/catalog'
import {CollectionCard} from './collection-card'
export function PublicProfile({username}:{username:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true),[itemCount,setItemCount]=useState(0)
 const router=useRouter()
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setLoading(false);return}
  let active=true
  void (async()=>{
   let {data}=await db.from('profiles').select('*').eq('username',username).maybeSingle()
   if(!data){const {data:alias}=await db.from('profile_username_aliases').select('profile_id').eq('username',username).maybeSingle();if(alias){const found=await db.from('profiles').select('*').eq('id',alias.profile_id).maybeSingle();data=found.data;if(data){router.replace('/u/'+encodeURIComponent(data.username));return}}}
   if(!data){if(active)setLoading(false);return}
   const {data:cols}=await db.from('collections').select('*').eq('owner_id',data.id).eq('is_public',true).order('created_at',{ascending:false})
   const ids=(cols||[]).map(x=>x.id)
   const {data:links}=ids.length?await db.from('collection_items').select('item_id').in('collection_id',ids):{data:[] as {item_id:string}[]}
   if(active){setProfile(data as ProfileRow);setCollections((cols||[]) as CollectionRow[]);setItemCount(new Set((links||[]).map(x=>x.item_id)).size);setLoading(false)}
  })().catch(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[username,router])
 if(loading)return <p>Carregando perfil…</p>
 if(!profile)return <div className="empty-collection-panel">Perfil não encontrado.</div>
 return <section className="public-profile"><div className="profile-preview"><span className="profile-avatar">{profile.avatar_path?<img className="public-avatar-image" src={getBrowserClient()?.storage.from("coollects-avatars").getPublicUrl(profile.avatar_path).data.publicUrl} alt={"Avatar de "+profile.display_name}/>:<UserRound size={42}/>}</span><h2>{profile.display_name}</h2><p>@{profile.username}</p><p>{profile.bio||'Mais histórias por vir.'}</p><div className="public-profile-stats"><strong>{collections.length} coleções públicas</strong><strong>{itemCount} itens públicos</strong></div></div><h2>Coleções públicas</h2>
  {collections.length?<div className="collection-grid">{collections.map(c=><CollectionCard key={c.id} collection={c}/>)}</div>:<div className="empty-collection-panel">Este colecionador ainda não compartilhou coleções.</div>}
 </section>
}
