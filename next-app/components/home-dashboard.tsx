'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,Layers3,Package } from 'lucide-react'
import { useAccount } from '@/hooks/use-account'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,safeColor } from '@/lib/catalog'
import {CollectibleCard} from './collectible-card'
import {CollectionCard} from './collection-card'
import {signedImage} from '@/lib/images'
export function HomeDashboard(){
 const {user,loading}=useAccount()
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [items,setItems]=useState<ItemRow[]>([])
 const [recentPhotos,setRecentPhotos]=useState<Record<string,string>>({})
 const [error,setError]=useState('')
 const [refreshKey,setRefreshKey]=useState(0)
 const [collectionTotal,setCollectionTotal]=useState(0)
 const [itemTotal,setItemTotal]=useState(0)
 useEffect(()=>{
  if(!user){setCollections([]);setItems([]);setRecentPhotos({});setCollectionTotal(0);setItemTotal(0);return}
  const db=getBrowserClient();if(!db)return
  let active=true
  setError('')
  void Promise.all([
   db.from('collections').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).limit(10),
   db.from('items').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).limit(4)
  ]).then(async([cs,is])=>{if(!active)return;if(cs.error||is.error){setError('Não conseguimos carregar seu acervo. Tente novamente.');return}setCollections((cs.data||[]) as CollectionRow[]);setCollectionTotal(cs.count??(cs.data||[]).length);setItems((is.data||[]) as ItemRow[]);setItemTotal(is.count??(is.data||[]).length);const recent=(is.data||[]).slice(0,4) as ItemRow[];const photos=await Promise.all(recent.map(async item=>[item.id,await signedImage(db,item.photo_path)] as const));if(active)setRecentPhotos(Object.fromEntries(photos.filter((entry):entry is readonly [string,string]=>Boolean(entry[1]))))})
  return ()=>{active=false}
 },[user,refreshKey])
 const recent=items.slice(0,4)
 return <>
 <section className="collector-dashboard-head"><div><h1>Início</h1></div>{!user&&<Link href="/entrar" className="collector-dashboard-add"><Camera size={21}/> Entrar <ArrowRight size={17}/></Link>}</section>
 <section className="collector-dashboard" aria-label="Painel do colecionador">
 {error&&<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>setRefreshKey(k=>k+1)}>Tentar novamente</button></p>}
 <div className="collector-metrics"><Link href="/acervo" className="collector-metric collector-metric-main"><Package size={19}/><strong>{loading?'—':itemTotal}</strong><span>Itens no acervo <ArrowRight size={14}/></span></Link><Link href="/acervo?aba=colecoes" className="collector-metric"><Layers3 size={19}/><strong>{loading?'—':collectionTotal}</strong><span>Coleções <ArrowRight size={14}/></span></Link></div>
 <div className="collector-section-bar"><div><h2>Coleções</h2></div><Link href="/acervo?aba=colecoes">Ver todas <ArrowRight size={15}/></Link></div>
 {collections.length?<div className="collector-collection-grid">{collections.slice(0,5).map(c=><CollectionCard key={c.id} collection={c}/>)}<Link className="collection-add-card" href="/colecoes?criar=1">+ Nova coleção</Link></div>:<div className="collector-empty"><strong>Comece sua primeira coleção</strong><Link href="/colecoes?criar=1">Nova coleção <ArrowRight size={15}/></Link></div>}
 <div className="collector-section-bar"><div><h2>Adicionados recentemente</h2></div><Link href="/acervo">Ver acervo <ArrowRight size={15}/></Link></div>
 {recent.length?<div className="collector-recent-grid">{recent.map(item=><CollectibleCard key={item.id} item={item} photoUrl={recentPhotos[item.id]||null} href={'/item/'+encodeURIComponent(item.id)}/>)}</div>:<Link className="collector-empty" href="/cadastrar">Adicionar seu primeiro item <ArrowRight size={18}/></Link>}
 </section>
 </>
}
