'use client'
import { useCallback,useEffect,useId,useRef,useState } from 'react'
import Link from 'next/link'
import { Heart,UserCheck,Users,X } from 'lucide-react'
import { Modal } from './modal'
import { CollectorAvatar } from './collector-avatar'
import { FollowButton } from './social-interactions'
import { getBrowserClient } from '@/lib/supabase/client'
import { publicUrlPath } from '@/lib/catalog'
import { formatCount,mergeById,type Connection,type ConnectionKind,type CollectorSummary } from '@/lib/social'
import { loadConnections } from '@/lib/social-data'
import { navigateTabs } from '@/lib/tab-navigation'

const TITLES:Record<ConnectionKind,string>={followers:'Seguidores',following:'Seguindo',likers:'Curtidas'}
const ICONS={followers:Users,following:UserCheck,likers:Heart}
const EMPTY:Record<ConnectionKind,string>={
 followers:'Ninguém segue este perfil ainda.',
 following:'Este perfil ainda não segue ninguém.',
 likers:'Ninguém curtiu este item ainda.'
}

/** One collector in a list: identity on the left, follow on the right. */
export function CollectorRow({collector,following,meta}:{collector:CollectorSummary;following:boolean;meta?:string}){
 return <li className="collector-row">
  <Link href={publicUrlPath(collector.username)} className="collector-row-identity">
   <CollectorAvatar name={collector.display_name} seed={collector.id} size="sm"/>
   <span><strong>{collector.display_name}</strong><small>@{collector.username}{meta?' · '+meta:''}</small></span>
  </Link>
  <FollowButton compact profileId={collector.id} name={collector.display_name} following={following}/>
 </li>
}

type Props={targetId:string;kinds:ConnectionKind[];initial:ConnectionKind;counts?:Partial<Record<ConnectionKind,number>>;label:string;onClose:()=>void}

export function ConnectionsSheet({targetId,kinds,initial,counts={},label,onClose}:Props){
 const id=useId(),generation=useRef(0),nextOffset=useRef(0),busy=useRef(false)
 const [kind,setKind]=useState(initial)
 const [rows,setRows]=useState<Connection[]>([])
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading')
 const [hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false)
 const [moreError,setMoreError]=useState(false),[attempt,setAttempt]=useState(0)
 const load=useCallback(async(offset:number)=>{
  const db=getBrowserClient()
  if(!db)throw new Error('offline')
  return loadConnections(db,kind,targetId,offset)
 },[kind,targetId])
 useEffect(()=>{
  let active=true
  generation.current+=1;busy.current=false;nextOffset.current=0
  setStatus('loading');setRows([]);setHasMore(false);setLoadingMore(false);setMoreError(false)
  load(0).then(page=>{if(active){nextOffset.current=page.length;setRows(page);setHasMore(page.length===30);setStatus('ready')}}).catch(()=>{if(active)setStatus('error')})
  return ()=>{active=false;generation.current+=1}
 },[load,attempt])
 async function more(){
  if(busy.current)return
  const requestGeneration=generation.current
  busy.current=true;setLoadingMore(true);setMoreError(false)
  try{const page=await load(nextOffset.current);if(generation.current!==requestGeneration)return;nextOffset.current+=page.length;setRows(current=>mergeById(current,page));setHasMore(page.length===30)}
  catch{if(generation.current===requestGeneration)setMoreError(true)}
  finally{if(generation.current===requestGeneration){busy.current=false;setLoadingMore(false)}}
 }
 return <Modal label={label} onClose={onClose} initialFocus=".connections-close">
  <section className="edit-modal connections-sheet">
   <button type="button" className="close-modal connections-close" aria-label="Fechar" onClick={onClose}><X size={20}/></button>
   {kinds.length>1?<div className="connections-tabs" role="tablist" aria-label={label} onKeyDown={navigateTabs}>{kinds.map(option=>{
    const Icon=ICONS[option]
    return <button key={option} type="button" role="tab" id={id+'-'+option} aria-controls={id+'-panel'} tabIndex={kind===option?0:-1} aria-selected={kind===option} onClick={()=>setKind(option)}>
     <Icon size={16} aria-hidden="true"/><span>{TITLES[option]}</span>{counts[option]!==undefined&&<b>{formatCount(counts[option]!)}</b>}
    </button>
   })}</div>:<h2>{TITLES[kind]}{counts[kind]!==undefined&&<b>{formatCount(counts[kind]!)}</b>}</h2>}
   <div className="connections-body" id={id+'-panel'} role={kinds.length>1?'tabpanel':undefined} aria-labelledby={kinds.length>1?id+'-'+kind:undefined}>
    {status==='loading'&&<ul className="collector-list" aria-busy="true">{[0,1,2].map(index=><li key={index} className="collector-row is-skeleton"><span className="collector-avatar avatar-sm"/><span><i/><i/></span></li>)}</ul>}
    {status==='error'&&<div className="connections-state" role="alert"><p>Não foi possível carregar esta lista.</p><button type="button" className="pill-btn" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></div>}
    {status==='ready'&&(rows.length?<ul className="collector-list">{rows.map(row=><CollectorRow key={row.id} collector={row} following={row.followed_by_me}/>)}</ul>:<div className="connections-state"><span className="connections-state-icon">{(()=>{const Icon=ICONS[kind];return <Icon size={24} aria-hidden="true"/>})()}</span><p>{EMPTY[kind]}</p></div>)}
    {moreError&&<p className="profile-inline-error" role="alert">Não foi possível carregar mais pessoas. Tente novamente no botão abaixo.</p>}
    {status==='ready'&&hasMore&&<button type="button" className="load-more" disabled={loadingMore} onClick={()=>void more()}>{loadingMore?'Carregando…':'Mostrar mais'}</button>}
   </div>
  </section>
 </Modal>
}
