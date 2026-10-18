'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,Compass,Search,Users } from 'lucide-react'
import {CollectionCard} from './collection-card'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ProfileRow,collectionUrlPath,publicUrlPath,safeColor } from '@/lib/catalog'
export function ExploreShowcase(){
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [profiles,setProfiles]=useState<Record<string,ProfileRow>>({})
 const [filter,setFilter]=useState('Tudo'),[query,setQuery]=useState('')
 const [debouncedQuery,setDebouncedQuery]=useState('')
 useEffect(()=>{const timeout=setTimeout(()=>setDebouncedQuery(query.trim().toLocaleLowerCase('pt-BR')),250);return()=>clearTimeout(timeout)},[query])
 const [loading,setLoading]=useState(true),[error,setError]=useState('')
 const [ownCollectionCount,setOwnCollectionCount]=useState<number|null>(null)
 const [retryKey,setRetryKey]=useState(0)
 const [offline,setOffline]=useState(false)
 useEffect(()=>{const check=()=>setOffline(!navigator.onLine);check();window.addEventListener('online',check);window.addEventListener('offline',check);return()=>{window.removeEventListener('online',check);window.removeEventListener('offline',check)}},[])
 useEffect(()=>{
  const db=getBrowserClient()
  if(!db){setError('Não conseguimos acessar as coleções agora. Tente novamente mais tarde.');setLoading(false);return}
  let active=true
  void db.auth.getUser().then(async({data:{user}})=>{if(!user)return;const count=await db.from('collections').select('id',{count:'exact',head:true}).eq('owner_id',user.id);if(active&&!count.error)setOwnCollectionCount(count.count??0)})
  void db.from('collections').select('*').eq('is_public',true).order('created_at',{ascending:false}).limit(60).then(async({data,error})=>{
   if(!active)return
   if(error){setError('Não foi possível carregar as coleções. Tente novamente.');setLoading(false);return}
   const cols=(data||[]) as CollectionRow[]
   const owners=[...new Set(cols.map(x=>x.owner_id))]
   if(owners.length){
    const {data:p}=await db.from('profiles').select('*').in('id',owners)
    if(active)setProfiles(Object.fromEntries(((p||[]) as ProfileRow[]).map(x=>[x.id,x])))
   }
   if(active){setCollections(cols);setLoading(false)}
  })
  return ()=>{active=false}
 },[retryKey])
 const filters=['Tudo',...new Set(collections.map(x=>x.category))]
 const visible=collections.filter(c=>(filter==='Tudo'||c.category===filter)&&[c.name,c.category,c.description,profiles[c.owner_id]?.display_name||''].join(' ').toLowerCase().includes(debouncedQuery))
 return <section className="explore-showcase">
  {!loading&&!error&&collections.length>0&&<><div className="explore-search"><Search size={20}/><input placeholder="Buscar coleção ou categoria" aria-label="Buscar coleções públicas" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Limpar busca" onClick={()=>setQuery('')}>Limpar</button>}</div>{filters.length>2&&<div className="chip-rail explore-filters">{filters.map(f=><button className={'chip '+(filter===f?'chip-active':'')} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div>}</>}
  {offline&&<p role="status" className="scan-notice">Você está sem conexão. Os resultados podem estar desatualizados.</p>}
  {error&&<div role="alert" className="scan-notice">{error} <button type="button" onClick={()=>{setLoading(true);setError("");setRetryKey(v=>v+1)}}>Tentar novamente</button></div>}
  {!error&&(loading?<p>Descobrindo coleções…</p>:visible.length===0?<div className="explore-no-results"><p>{collections.length?(query.trim()?'Nenhuma coleção corresponde à busca.':'Nenhuma coleção nesta categoria.'):'Ainda não há coleções públicas. A sua pode ser a primeira!'}</p>{collections.length?<button type="button" className="pill-btn" onClick={()=>{setQuery('');setFilter('Tudo')}}>Limpar filtros</button>:<Link className="pill-btn" href={ownCollectionCount===0?"/colecoes?criar=1":"/colecoes"}>Publicar uma coleção <ArrowRight size={17}/></Link>}</div>:<div className="explore-grid">{visible.map(c=><CollectionCard key={c.id} collection={c} author={profiles[c.owner_id]?.display_name||'Colecionador'} href={collectionUrlPath(c.id)+'?origem=explorar'}/>)}</div>)}
  {Object.values(profiles).length>0&&<div className="collectors-strip"><h3>Conheça colecionadores</h3>{Object.values(profiles).slice(0,12).map(p=><Link key={p.id} href={publicUrlPath(p.username)}><span className="small-avatar">{p.display_name.slice(0,1).toUpperCase()}</span><strong>{p.display_name}</strong><ArrowRight size={16}/></Link>)}</div>}

 </section>
}
