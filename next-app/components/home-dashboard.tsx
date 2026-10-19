'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,FolderPlus,Package } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,collectionUrlPath } from '@/lib/catalog'
import { CollectionCard } from './collection-card'
import { CollectibleCard } from './collectible-card'
import {signedImage} from '@/lib/images'
export function HomeDashboard({user}:{user:User}){
 const [loading,setLoading]=useState(true)
 const [displayName,setDisplayName]=useState('')
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [items,setItems]=useState<ItemRow[]>([])
 const [recentPhotos,setRecentPhotos]=useState<Record<string,string>>({})
 const [error,setError]=useState('')
 const [refreshKey,setRefreshKey]=useState(0)
 const [collectionTotal,setCollectionTotal]=useState(0)
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setLoading(false);setError('Não conseguimos carregar seu acervo. Tente novamente.');return}
  let active=true
  setLoading(true)
  setError('')
  void Promise.all([
   db.from('collections').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).limit(10),
   db.from('items').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}),
   db.from('profiles').select('display_name').eq('id',user.id).maybeSingle()
  ]).then(async([cs,is,profile])=>{
   if(!active)return
   if(cs.error||is.error){setError('Não conseguimos carregar seu acervo. Tente novamente.');return}
   setDisplayName(typeof profile.data?.display_name==='string'?profile.data.display_name:'')
   setCollections((cs.data||[]) as CollectionRow[])
   setCollectionTotal(cs.count??(cs.data||[]).length)
   setItems((is.data||[]) as ItemRow[])
   const recent=(is.data||[]).slice(0,4) as ItemRow[]
   const photos=await Promise.all(recent.map(async item=>[item.id,await signedImage(db,item.photo_path)] as const))
   if(active)setRecentPhotos(Object.fromEntries(photos.filter((entry):entry is readonly [string,string]=>Boolean(entry[1]))))
  })
   .catch(()=>{if(active)setError('Não conseguimos carregar seu acervo. Tente novamente.')})
   .finally(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[user.id,refreshKey])
 const recent=items.slice(0,4)
 const metadataName=typeof user.user_metadata?.display_name==='string'?user.user_metadata.display_name:''
 const firstName=(displayName||metadataName).trim().split(/\s+/)[0]
 return <>
 <section className="collector-dashboard-head home-greeting"><div><p className="kicker">SEU UNIVERSO DE COLEÇÕES</p><h1>Olá{firstName?<>, <em>{firstName}!</em></>:' de novo!'}</h1><p>Vamos dar espaço à próxima descoberta?</p></div></section>
 <section className="collector-dashboard home-acervo" aria-label="Painel do colecionador">
 <div className="home-shortcuts" aria-label="Adicionar ao acervo">
  <Link href="/cadastrar" className="home-shortcut home-shortcut-primary"><Camera size={26}/><span>Cadastrar<br/>item</span><ArrowRight size={18} className="home-shortcut-arrow"/></Link>
  <Link href="/colecoes?criar=1" className="home-shortcut home-shortcut-secondary"><FolderPlus size={26}/><span>Nova<br/>coleção</span><ArrowRight size={18} className="home-shortcut-arrow"/></Link>
 </div>
 {loading?<p className="home-load-status" role="status">Buscando suas coleções e descobertas…</p>
 :error?<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>setRefreshKey(k=>k+1)}>Tentar novamente</button></p>
 :!items.length&&!collections.length?<div className="home-first-item">
  <span className="home-first-symbol" aria-hidden="true"><Package size={34}/></span>
  <p className="kicker">TODA COLEÇÃO TEM UM COMEÇO</p>
  <h2>Qual peça conta<br/>a sua primeira história?</h2>
  <p>Cadastre uma peça que você ama. Depois, organize suas descobertas em coleções.</p>
  <Link href="/cadastrar">Cadastrar meu primeiro item <ArrowRight size={17}/></Link>
 </div>:<>
 <div className="collector-section-bar"><div><p className="kicker">SEUS UNIVERSOS</p><h2>Suas coleções</h2></div><Link href="/colecoes">Ver todas <ArrowRight size={15}/></Link></div>
 {collections.length?<div className="collector-collection-grid">{collections.slice(0,6).map(c=><CollectionCard key={c.id} collection={c} href={collectionUrlPath(c.id)}/>)}</div>:<div className="collector-empty"><strong>Dê um lugar às suas descobertas</strong><Link href="/colecoes?criar=1">Criar coleção <ArrowRight size={15}/></Link></div>}
 <div className="collector-section-bar"><div><p className="kicker">RECÉM-DESCOBERTOS</p><h2>Últimos itens</h2></div><Link href="/itens">Ver acervo <ArrowRight size={15}/></Link></div>
 {recent.length?<div className="collector-recent-grid">{recent.map(item=><CollectibleCard key={item.id} item={item} photoUrl={recentPhotos[item.id]||null} href={'/item/'+encodeURIComponent(item.id)}/>)}</div>:<Link className="collector-empty" href="/cadastrar">Sua próxima descoberta merece uma ficha. <ArrowRight size={18}/></Link>}
 <div className="home-acervo-totals" aria-label="Resumo do acervo"><span>{items.length} {items.length===1?'item':'itens'}</span><span aria-hidden="true">·</span><span>{collectionTotal} {collectionTotal===1?'coleção':'coleções'}</span></div>
 </>}
 </section>
 </>
}
