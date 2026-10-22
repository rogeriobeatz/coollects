'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {Heart,Package,Users} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import {useAccount} from '@/hooks/use-account'
import {publicUrlPath} from '@/lib/catalog'
import {countLabel,type DiscoverableCollector} from '@/lib/social'
import {loadDiscoverableCollectors} from '@/lib/social-data'
import {CollectorAvatar} from './collector-avatar'
import {FollowButton} from './social-interactions'

const PAGE_SIZE=24

/** Searchable, ranked directory. No published collection is required to appear. */
export function CollectorDirectory({query}:{query:string}){
 const {user}=useAccount()
 const [rows,setRows]=useState<DiscoverableCollector[]>([])
 const [loading,setLoading]=useState(true),[loadingMore,setLoadingMore]=useState(false)
 const [hasMore,setHasMore]=useState(false),[error,setError]=useState(''),[moreError,setMoreError]=useState('')
 const [retry,setRetry]=useState(0)
 const generation=useRef(0)
 const nextOffset=useRef(0)
 const normalized=query.trim().replace(/^@/,'')
 useEffect(()=>{
  const generationId=++generation.current
  setLoading(true);setError('');setMoreError('');setRows([])
  const db=getBrowserClient()
  if(!db){setError('Não foi possível conectar.');setLoading(false);return}
  void loadDiscoverableCollectors(db,normalized,0,PAGE_SIZE)
   .then(page=>{if(generationId!==generation.current)return;setRows(page.items);nextOffset.current=page.items.length;setHasMore(page.hasMore)})
   .catch(()=>{if(generationId===generation.current)setError('Não foi possível carregar os colecionadores.')})
   .finally(()=>{if(generationId===generation.current)setLoading(false)})
  return ()=>{generation.current++}
 },[normalized,retry])
 async function more(){
  if(loadingMore||!hasMore)return
  const db=getBrowserClient()
  if(!db){setMoreError('Sem conexão. Tente novamente.');return}
  const requestId=generation.current
  setLoadingMore(true);setMoreError('')
  try{
   const page=await loadDiscoverableCollectors(db,normalized,nextOffset.current,PAGE_SIZE)
   if(requestId!==generation.current)return
   nextOffset.current+=page.items.length
   setRows(prev=>[...new Map([...prev,...page.items].map(c=>[c.id,c])).values()])
   setHasMore(page.hasMore)
  }catch{if(requestId===generation.current)setMoreError('Não foi possível carregar mais perfis.')}
  finally{if(requestId===generation.current)setLoadingMore(false)}
 }
 return <section className="collector-directory" aria-labelledby="collector-directory-heading">
  <div className="profile-section-head"><h2 id="collector-directory-heading"><Users size={19}/> Colecionadores</h2></div>
  {loading?<p role="status">Procurando colecionadores…</p>
   :error?<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></p>
   :rows.length===0?<p className="explore-no-results">Nenhum colecionador encontrado{normalized?' para essa busca':''}.</p>
   :<><ul className="collector-directory-grid">
    {rows.map(person=><li className="suggested-card" key={person.id}>
     <Link className="suggested-identity" href={publicUrlPath(person.username)}>
      <CollectorAvatar name={person.display_name} seed={person.id} size="md"/>
      <strong>{person.display_name}</strong><small>@{person.username}</small>
      <span className="suggested-meta" aria-label={[countLabel(person.public_items,'item público','itens públicos'),countLabel(person.likes_received,'curtida recebida','curtidas recebidas'),countLabel(person.followers,'seguidor','seguidores')].join(', ')}>
       <span title="Itens públicos"><Package size={13}/>{person.public_items}</span>
       <span title="Curtidas recebidas"><Heart size={13}/>{person.likes_received}</span>
       <span title="Seguidores"><Users size={13}/>{person.followers}</span>
      </span>
     </Link>
     {person.id!==user?.id&&<FollowButton profileId={person.id} name={person.display_name} following={person.followed_by_me}/>}
    </li>)}
   </ul>
   {moreError&&<p className="scan-notice" role="alert">{moreError}</p>}
   {hasMore&&<button type="button" className="load-more" disabled={loadingMore} onClick={()=>void more()}>{loadingMore?'Carregando…':'Mostrar mais colecionadores'}</button>}
   </>}
 </section>
}
