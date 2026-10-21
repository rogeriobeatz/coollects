'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {ArrowRight,Search,Users} from 'lucide-react'
import {CollectionCard} from './collection-card'
import {getBrowserClient} from '@/lib/supabase/client'
import {collectionUrlPath} from '@/lib/catalog'
import {discoverCollections,type DiscoveredCollection} from '@/lib/discovery'
import {CATEGORIES} from '@/lib/local-catalog'
import {SuggestedCollectors} from './suggested-collectors'

export function ExploreShowcase(){
 const [collections,setCollections]=useState<DiscoveredCollection[]>([])
 const [filter,setFilter]=useState('Tudo'),[query,setQuery]=useState(''),[debouncedQuery,setDebouncedQuery]=useState('')
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 const [hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false),[moreError,setMoreError]=useState('')
 const [offline,setOffline]=useState(false)
 const generation=useRef(0),busy=useRef(false),offset=useRef(0)
 useEffect(()=>{const timer=setTimeout(()=>setDebouncedQuery(query.trim()),250);return()=>clearTimeout(timer)},[query])
 useEffect(()=>{const check=()=>setOffline(!navigator.onLine);check();window.addEventListener('online',check);window.addEventListener('offline',check);return()=>{window.removeEventListener('online',check);window.removeEventListener('offline',check)}},[])
 useEffect(()=>{
  const current=++generation.current
  busy.current=true;setLoading(true);setError('');setMoreError('');setLoadingMore(false)
  const db=getBrowserClient()
  void (async()=>{
   try{
    if(!db)throw new Error('offline')
    const page=await discoverCollections(db,debouncedQuery,filter,0)
    if(current!==generation.current)return
    setCollections(page.rows);setHasMore(page.hasMore);offset.current=page.rows.length
   }catch{if(current===generation.current)setError('Não foi possível carregar as coleções. Tente novamente.')}
   finally{if(current===generation.current){setLoading(false);busy.current=false}}
  })()
  return()=>{generation.current++}
 },[debouncedQuery,filter,retry])
 async function more(){
  const db=getBrowserClient();if(!db||busy.current)return
  const current=generation.current
  busy.current=true;setLoadingMore(true);setMoreError('')
  try{
   const page=await discoverCollections(db,debouncedQuery,filter,offset.current)
   if(current!==generation.current)return
   offset.current+=page.rows.length
   setCollections(rows=>[...new Map([...rows,...page.rows].map(row=>[row.id,row])).values()]);setHasMore(page.hasMore)
  }catch{if(current===generation.current)setMoreError('Não foi possível carregar mais coleções. Tente novamente.')}
  finally{if(current===generation.current){busy.current=false;setLoadingMore(false)}}
 }
 const filtered=Boolean(query.trim()||filter!=='Tudo')
 return <section className="explore-showcase">
  <div className="explore-search"><Search size={22} aria-hidden="true"/><input maxLength={100} placeholder="Coleção, categoria ou colecionador" aria-label="Buscar coleções públicas" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Limpar busca" onClick={()=>setQuery('')}>Limpar</button>}</div>
  <div className="chip-rail explore-filters" role="group" aria-label="Categorias públicas">{['Tudo',...CATEGORIES.map(c=>c.name)].map(category=><button type="button" className={'chip '+(filter===category?'chip-active':'')} aria-pressed={filter===category} key={category} onClick={()=>setFilter(category)}>{category}</button>)}</div>
  {offline&&<p role="status" className="scan-notice">Você está sem conexão. Os resultados podem estar desatualizados.</p>}
  {error?<div role="alert" className="scan-notice">{error} <button type="button" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></div>
   :loading?<p role="status">Descobrindo coleções…</p>
   :collections.length?<><div className="explore-grid">{collections.map(collection=><CollectionCard key={collection.id} collection={collection} href={collectionUrlPath(collection.id)+'?origem=explorar'} meta={'por '+(collection.author?.display_name||'Colecionador')}/>)}</div>
    {moreError&&<p role="alert" className="scan-notice">{moreError}</p>}
    {hasMore&&<button type="button" className="load-more" disabled={loadingMore} onClick={()=>void more()}>{loadingMore?'Carregando…':'Mostrar mais coleções'}</button>}</>
   :<div className="explore-no-results"><p>{filtered?'Nenhuma coleção corresponde à busca.':'Ainda não há coleções públicas. A sua pode ser a primeira!'}</p>{filtered?<button type="button" className="pill-btn" onClick={()=>{setQuery('');setFilter('Tudo')}}>Limpar filtros</button>:<Link className="pill-btn" href="/colecoes?criar=1">Criar uma coleção <ArrowRight size={17}/></Link>}</div>}
  {!loading&&!error&&<SuggestedCollectors title="Conheça colecionadores"/>}
  {!loading&&!error&&!filtered&&collections.length>0&&<div className="explore-footer"><Users size={25} aria-hidden="true"/><div><strong>Compartilhe seu universo.</strong><p>Publique uma coleção para aparecer aqui.</p></div><Link href="/colecoes" aria-label="Ver minhas coleções"><ArrowRight size={22}/></Link></div>}
 </section>
}
