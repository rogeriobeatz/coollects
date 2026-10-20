'use client'
import { EmptyIllustration } from './empty-illustration'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,UserRound } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ProfileRow,collectionUrlPath } from '@/lib/catalog'
import { CollectionCard } from './collection-card'
import { SocialProfileStats } from './social-interactions'
import {signedImage} from '@/lib/images'
export function PublicProfile({username}:{username:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true)
 const [gallery,setGallery]=useState<Array<{id:string;name:string;url:string|null}>>([])
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setLoading(false);return}
  let active=true
  void (async()=>{
   const {data}=await db.from('profiles').select('*').eq('username',username).maybeSingle()
   if(!data){if(active)setLoading(false);return}
   const {data:cols}=await db.from('collections').select('*').eq('owner_id',data.id).eq('is_public',true).order('created_at',{ascending:false})
   const visible=(cols||[]) as CollectionRow[]
   const dbItems=visible.length?await db.from('collection_items').select('item_id').in('collection_id',visible.map(c=>c.id)):null
   const itemIds=[...new Set((dbItems?.data||[]).map(x=>x.item_id))]
   let tiles:Array<{id:string;name:string;url:string|null}>=[]
   if(itemIds.length){
    const {data:items}=await db.from('items').select('id,name,photo_path,created_at').in('id',itemIds).order('created_at',{ascending:false}).limit(60)
    tiles=await Promise.all((items||[]).map(async item=>({id:item.id,name:item.name,url:await signedImage(db,item.photo_path)})))
   }
   if(active){setProfile(data as ProfileRow);setCollections(visible);setGallery(tiles);setLoading(false)}
  })().catch(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[username])
 if(loading)return <p>Carregando perfil…</p>
 if(!profile)return <div className="empty-collection-panel">Perfil não encontrado.</div>
 return <section className="public-profile"><div className="profile-preview"><span className="profile-avatar"><UserRound size={42}/></span><h2>{profile.display_name}</h2><p>@{profile.username}</p><p>{profile.bio||'Mais histórias por vir.'}</p><SocialProfileStats profileId={profile.id}/></div><div className="section-title-inline"><h2>Suas coleções<br/><em>públicas.</em></h2></div>
  {collections.length?<div className="collection-grid">{collections.map(c=><CollectionCard key={c.id} collection={c} href={collectionUrlPath(c.id)}/>)}</div>:<div className="empty-collection-panel"><EmptyIllustration kind="shelf"/><p>Este colecionador ainda não compartilhou coleções.</p></div>}
 {gallery.length>0&&<section style={{marginTop:32}}><h2>Galeria de itens</h2><div className="explore-grid">{gallery.map(item=><Link href={'/item/'+encodeURIComponent(item.id)} key={item.id} style={{display:'block'}}>{item.url?<img src={item.url} alt={item.name} loading="lazy" style={{width:'100%',aspectRatio:'1',objectFit:'cover',borderRadius:12}}/>:<div className="empty-collection-panel">Sem foto</div>}<strong>{item.name}</strong></Link>)}</div></section>}
 </section>
}
