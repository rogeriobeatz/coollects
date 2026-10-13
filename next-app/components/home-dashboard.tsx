'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,Layers3,Package,Sparkles,WandSparkles } from 'lucide-react'
import { useAccount } from '@/hooks/use-account'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
export function HomeDashboard(){
 const {user,loading,configured}=useAccount()
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [items,setItems]=useState<ItemRow[]>([])
 useEffect(()=>{
  if(!user){setCollections([]);setItems([]);return}
  const db=getBrowserClient();if(!db)return
  let active=true
  void Promise.all([
   db.from('collections').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(10),
   db.from('items').select('*').eq('owner_id',user.id).order('created_at',{ascending:false})
  ]).then(([cs,is])=>{if(active){setCollections((cs.data||[]) as CollectionRow[]);setItems((is.data||[]) as ItemRow[])}})
  return ()=>{active=false}
 },[user])
 return <>
 <section className="home-hero"><span className="orbit orbit-one" aria-hidden="true"/><span className="orbit orbit-two" aria-hidden="true"/>
  <p className="kicker kicker-light">O UNIVERSO É SEU ◌</p>
  <h1>Suas paixões.<br/><span>Sem limites.</span></h1>
  <p className="hero-copy">Toda coleção tem uma história. Qual é a próxima?</p>
  <Link href={user?'/cadastrar':'/entrar'} className="scan-action"><span className="scan-icon"><Camera size={27} strokeWidth={2.8}/></span><span>{user?'Escanear':'Entre para'}<br/>{user?'novo item':'colecionar'}</span><span className="circle-arrow"><ArrowRight size={24}/></span></Link>
  <span className="hero-sticker" aria-hidden="true">✦<br/>COOL!</span>
 </section>
 <section className="dashboard-content">
  {!configured&&<p className="local-banner">Conecte o Supabase para liberar contas, coleções e itens. Veja o guia no repositório.</p>}
  <div className="stat-strip" aria-label="Resumo das coleções"><div><span className="stat-symbol"><Package size={20}/></span><strong>{loading?'–':items.length}</strong><small>Itens</small></div><div><span className="stat-symbol"><Layers3 size={20}/></span><strong>{loading?'–':collections.length}</strong><small>Coleções</small></div><div><span className="stat-symbol"><Sparkles size={20}/></span><strong>01</strong><small>Universo</small></div></div>
  <div className="editorial-heading"><div><p className="kicker">SEU ACERVO</p><h2>Minhas<br/><em>coleções.</em></h2></div><Link href="/colecoes" className="text-link">Ver todas <ArrowRight size={17}/></Link></div>
  {collections.length>0?<div className="poster-carousel">{collections.map(c=><Link href={'/colecao/'+c.id} key={c.id} className="collection-poster" style={{'--poster-accent':safeColor(c.color)} as CSSProperties}><CategoryArt category={c.category}/><div className="poster-info"><small>{c.category}</small><strong>{c.name}</strong><span>{c.is_public?'Pública':'Privada'} <ArrowRight size={15}/></span></div></Link>)}</div>
  :<div className="empty-editorial"><span className="empty-star" aria-hidden="true">✳</span><div><strong>Seu primeiro universo começa aqui.</strong><p>{user?'Crie uma coleção e dê vida ao seu acervo.':'Entre ou crie uma conta para começar.'}</p><Link href={user?'/colecoes':'/registrar'}>{user?'Criar coleção':'Criar conta'} <ArrowRight size={16}/></Link></div></div>}
  <div className="editorial-heading explore-title"><div><p className="kicker">NÃO PARE POR AQUI</p><h2>Explore<br/><em>mais.</em></h2></div><WandSparkles size={31} color="#F15700"/></div>
  <div className="discovery-band"><span className="discovery-scribble" aria-hidden="true">✳</span><span className="discovery-copy"><strong>Colecionar conecta.</strong><small>Descubra coleções públicas e pessoas com a mesma paixão.</small></span><Link href="/explorar" aria-label="Ir para explorar"><ArrowRight size={22}/></Link></div>
  {user&&<Link href="/itens" className="next-step-link"><span><Package size={20}/></span><strong>Gerenciar todos os meus itens</strong><ArrowRight size={19}/></Link>}
 </section>
 </>
}
