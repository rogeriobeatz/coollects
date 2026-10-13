'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Camera, Layers3, Package, Sparkles, WandSparkles } from 'lucide-react'
import { CategoryArt } from './category-art'
import { getCollections,getItems,LocalCollection,LocalItem,UPDATE_EVENT } from '@/lib/local-catalog'
export function HomeDashboard(){
 const [collections,setCollections]=useState<LocalCollection[]>([])
 const [items,setItems]=useState<LocalItem[]>([])
 const [loaded,setLoaded]=useState(false)
 useEffect(()=>{
  const sync=()=>{setCollections(getCollections());setItems(getItems());setLoaded(true)}
  sync();window.addEventListener(UPDATE_EVENT,sync);window.addEventListener('storage',sync)
  return ()=>{window.removeEventListener(UPDATE_EVENT,sync);window.removeEventListener('storage',sync)}
 },[])
 return <>
  <section className="home-hero">
   <span className="orbit orbit-one" aria-hidden="true"/><span className="orbit orbit-two" aria-hidden="true"/>
   <p className="kicker kicker-light">O UNIVERSO É SEU ◌</p>
   <h1>Suas paixões.<br/><span>Sem limites.</span></h1>
   <p className="hero-copy">Toda coleção tem uma história. Qual é a próxima?</p>
   <Link href="/cadastrar" className="scan-action"><span className="scan-icon"><Camera size={27} strokeWidth={2.8}/></span><span>Escanear<br/>novo item</span><span className="circle-arrow"><ArrowRight size={24}/></span></Link>
   <span className="hero-sticker" aria-hidden="true">✦<br/>COOL!</span>
  </section>
  <section className="dashboard-content">
   <div className="stat-strip" aria-label="Resumo da biblioteca local">
    <div><span className="stat-symbol"><Package size={20}/></span><strong>{loaded?items.length:'–'}</strong><small>Itens</small></div>
    <div><span className="stat-symbol"><Layers3 size={20}/></span><strong>{loaded?collections.length:'–'}</strong><small>Coleções</small></div>
    <div><span className="stat-symbol"><Sparkles size={20}/></span><strong>01</strong><small>Universo</small></div>
   </div>
   <div className="editorial-heading"><div><p className="kicker">SEU ACERVO</p><h2>Minhas<br/><em>coleções.</em></h2></div><Link href="/colecoes" className="text-link">Ver todas <ArrowRight size={17}/></Link></div>
   {collections.length>0?<div className="poster-carousel">
    {collections.slice(0,8).map(c=><Link href="/colecoes" className="collection-poster" key={c.id} style={{'--poster-accent':/^#[0-9a-fA-F]{6}$/.test(c.color)?c.color:'#6125BF'} as React.CSSProperties}><CategoryArt category={c.category}/><div className="poster-info"><small>{c.category}</small><strong>{c.name}</strong><span>{items.filter(i=>i.collectionId===c.id).length} itens <ArrowRight size={15}/></span></div></Link>)}
   </div>:<div className="empty-editorial"><span className="empty-star">✳</span><div><strong>Seu primeiro universo começa aqui.</strong><p>Crie uma coleção e preencha esse espaço com suas descobertas.</p><Link href="/colecoes">Criar coleção <ArrowRight size={16}/></Link></div></div>}
   <div className="editorial-heading explore-title"><div><p className="kicker">NÃO PARE POR AQUI</p><h2>Explore<br/><em>mais.</em></h2></div><WandSparkles size={31} color="#F15700"/></div>
   <div className="discovery-band"><span className="discovery-scribble" aria-hidden="true">✳</span><span className="discovery-copy"><strong>Colecionar conecta.</strong><small>Um mundo de histórias e colecionadores está chegando.</small></span><Link href="/explorar" aria-label="Ir para Explorar"><ArrowRight size={22}/></Link></div>
   <p className="local-note">MODO PRÉVIA · Dados salvos só neste dispositivo.</p>
  </section>
 </>
}
