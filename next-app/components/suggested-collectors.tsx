'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { Package,Users } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAccount } from '@/hooks/use-account'
import { publicUrlPath } from '@/lib/catalog'
import { countLabel,type SuggestedCollector } from '@/lib/social'
import { loadSuggestions } from '@/lib/social-data'
import { CollectorAvatar } from './collector-avatar'
import { FollowButton } from './social-interactions'

/** Horizontal rail of collectors with public collections. */
export function SuggestedCollectors({title}:{title:string}){
 const {user,loading}=useAccount()
 const [rows,setRows]=useState<SuggestedCollector[]|null>(null)
 useEffect(()=>{
  if(loading)return
  const db=getBrowserClient()
  if(!db)return
  let active=true
  loadSuggestions(db,12).then(list=>{if(active)setRows(list)}).catch(()=>{if(active)setRows([])})
  return ()=>{active=false}
 },[user?.id,loading])
 if(!rows||!rows.length)return null
 return <section className="suggested-collectors" aria-labelledby="sugestoes-titulo">
  <h2 id="sugestoes-titulo"><Users size={18} aria-hidden="true"/>{title}</h2>
  <ul className="suggested-rail">{rows.map(row=><li key={row.id} className="suggested-card">
   <Link href={publicUrlPath(row.username)} className="suggested-identity">
    <CollectorAvatar name={row.display_name} seed={row.id} size="md"/>
    <strong>{row.display_name}</strong>
    <small>@{row.username}</small>
    <span className="suggested-meta" role="img" aria-label={countLabel(row.public_items,'item público','itens públicos')+', '+countLabel(row.followers,'seguidor','seguidores')}>
     <span><Package size={13} aria-hidden="true"/>{row.public_items}</span><span><Users size={13} aria-hidden="true"/>{row.followers}</span>
    </span>
   </Link>
   <FollowButton profileId={row.id} name={row.display_name} following={false}/>
  </li>)}</ul>
 </section>
}
