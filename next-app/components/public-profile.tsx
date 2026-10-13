'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,UserRound } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ProfileRow,collectionUrlPath,safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
export function PublicProfile({username}:{username:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true)
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setLoading(false);return}
  let active=true
  void (async()=>{
   const {data}=await db.from('profiles').select('*').eq('username',username).maybeSingle()
   if(!data){if(active)setLoading(false);return}
   const {data:cols}=await db.from('collections').select('*').eq('owner_id',data.id).eq('is_public',true).order('created_at',{ascending:false})
   if(active){setProfile(data as ProfileRow);setCollections((cols||[]) as CollectionRow[]);setLoading(false)}
  })().catch(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[username])
 if(loading)return <p>Carregando perfil…</p>
 if(!profile)return <div className="empty-collection-panel">Perfil não encontrado.</div>
 return <section className="public-profile"><div className="profile-preview"><span className="profile-avatar"><UserRound size={42}/></span><h2>{profile.display_name}</h2><p>@{profile.username}</p><p>{profile.bio||'Mais histórias por vir.'}</p></div><div className="section-title-inline"><h2>Suas coleções<br/><em>públicas.</em></h2></div>
  {collections.length?<div className="collection-grid">{collections.map(c=><Link href={collectionUrlPath(c.id)} key={c.id} className="collection-card" style={{'--poster-accent':safeColor(c.color)} as CSSProperties}><CategoryArt category={c.category}/><div className="collection-card-bottom"><small>{c.category}</small><h3>{c.name}</h3><span>Ver coleção <ArrowRight size={15}/></span></div></Link>)}</div>:<div className="empty-collection-panel">Este colecionador ainda não compartilhou coleções.</div>}
 </section>
}
