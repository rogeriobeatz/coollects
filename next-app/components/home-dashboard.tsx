'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,Layers3,Package } from 'lucide-react'
import { useAccount } from '@/hooks/use-account'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
import {signedImage} from '@/lib/images'
export function HomeDashboard(){
 const {user,loading}=useAccount()
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [items,setItems]=useState<ItemRow[]>([])
 const [recentPhotos,setRecentPhotos]=useState<Record<string,string>>({})
 const [error,setError]=useState('')
 const [refreshKey,setRefreshKey]=useState(0)
 useEffect(()=>{
  if(!user){setCollections([]);setItems([]);setRecentPhotos({});return}
  const db=getBrowserClient();if(!db)return
  let active=true
  setError('')
  void Promise.all([
   db.from('collections').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).limit(10),
   db.from('items').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
  ]).then(async([cs,is])=>{if(!active)return;if(cs.error||is.error){setError('Não conseguimos carregar seu acervo. Tente novamente.');return}setCollections((cs.data||[]) as CollectionRow[]);setItems((is.data||[]) as ItemRow[]);const recent=(is.data||[]).slice(0,4) as ItemRow[];const photos=await Promise.all(recent.map(async item=>[item.id,await signedImage(db,item.photo_path)] as const));if(active)setRecentPhotos(Object.fromEntries(photos.filter((entry):entry is readonly [string,string]=>Boolean(entry[1]))))})
  return ()=>{active=false}
 },[user,refreshKey])
 const recent=items.slice(0,4)
 return <>
 <section className="collector-dashboard-head"><div><p className="kicker">MEU UNIVERSO / COOLLECTS</p><h1>Meu <em>acervo.</em></h1><p>Suas descobertas, sempre à mão.</p></div>{!user&&<Link href="/entrar" className="collector-dashboard-add"><Camera size={21}/> Entrar <ArrowRight size={17}/></Link>}</section>
 <section className="collector-dashboard" aria-label="Painel do colecionador">
 {error&&<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>setRefreshKey(k=>k+1)}>Tentar novamente</button></p>}
 <div className="collector-metrics"><Link href="/itens" className="collector-metric collector-metric-main"><Package size={19}/><strong>{loading?'—':items.length}</strong><span>Itens no acervo <ArrowRight size={14}/></span></Link><Link href="/colecoes" className="collector-metric"><Layers3 size={19}/><strong>{loading?'—':collections.length}</strong><span>Coleções <ArrowRight size={14}/></span></Link></div>
 <div className="collector-section-bar"><div><p className="kicker">SEUS UNIVERSOS</p><h2>Coleções</h2></div><Link href="/colecoes">Ver todas <ArrowRight size={15}/></Link></div>
 {collections.length?<div className="collector-collection-grid">{collections.slice(0,6).map(c=><Link className="collector-collection-card" href={'/colecao/'+c.id} key={c.id} style={{'--poster-accent':safeColor(c.color)} as CSSProperties}><div className="collector-collection-art"><CategoryArt category={c.category}/></div><span>{c.category}</span><strong>{c.name}</strong></Link>)}</div>:<div className="collector-empty"><strong>Comece sua primeira coleção</strong><Link href="/colecoes">Criar coleção <ArrowRight size={15}/></Link></div>}
 <div className="collector-section-bar"><div><p className="kicker">RECÉM-DESCOBERTOS</p><h2>Últimos itens</h2></div><Link href="/itens">Ver acervo <ArrowRight size={15}/></Link></div>
 {recent.length?<div className="collector-recent-grid">{recent.map((item,index)=><Link href={'/item/'+encodeURIComponent(item.id)} key={item.id} className="collector-recent-card"><span className="collector-recent-number">{String(index+1).padStart(2,'0')}</span>{recentPhotos[item.id]?<img src={recentPhotos[item.id]} alt={item.name} className="collector-recent-photo" loading="lazy"/>:<Package size={27}/>}<strong>{item.name}</strong><small>{item.brand||item.category}</small><ArrowRight className="collector-recent-arrow" size={17}/></Link>)}</div>:<Link className="collector-empty" href="/cadastrar">Sua próxima descoberta merece uma ficha. <ArrowRight size={18}/></Link>}
 </section>
 </>
}
