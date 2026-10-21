'use client'
import { useEffect,useState } from 'react'
import { CollectibleCard } from './collectible-card'
import { CollectionView } from './collection-view'
import { CardSocialBar,useItemSocial } from './social-interactions'
import { getBrowserClient } from '@/lib/supabase/client'
import type { CollectorSummary } from '@/lib/social'
import { loadCollectors,type SocialItem } from '@/lib/social-data'

type Props={
 items:SocialItem[];itemHref:(item:SocialItem)=>string;storageKey:string
 showAuthors?:boolean;hasMore?:boolean;loadingMore?:boolean;onMore?:()=>void
}

/** Item cards with likes (and authors when items come from many collectors). */
export function SocialItemGrid({items,itemHref,storageKey,showAuthors=false,hasMore=false,loadingMore=false,onMore}:Props){
 const {social,status,retry}=useItemSocial(items.map(item=>item.id))
 const authors=useAuthors(showAuthors?items.map(item=>item.owner_id):[])
 return <>
  {status==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar as curtidas. <button type="button" onClick={retry}>Tentar novamente</button></p>}
  <CollectionView compact storageKey={storageKey} items={items}
   getItem={item=>({item,photoUrl:item.url,href:itemHref(item)})}
   renderCard={item=><CollectibleCard item={item} photoUrl={item.url} href={itemHref(item)}
    footer={<CardSocialBar itemId={item.id} itemName={item.name} ownerId={item.owner_id} social={social.get(item.id)} status={status} author={showAuthors?authors.get(item.owner_id):null}/>}/>}/>
  {hasMore&&onMore&&<button type="button" className="load-more" disabled={loadingMore} onClick={onMore}>{loadingMore?'Carregando…':'Mostrar mais'}</button>}
 </>
}

/** Public identities of item owners, loaded once per new set of ids. */
export function useAuthors(ids:string[]){
 const key=[...new Set(ids)].sort().join(',')
 const [authors,setAuthors]=useState<Map<string,CollectorSummary>>(()=>new Map())
 useEffect(()=>{
  const db=getBrowserClient()
  const missing=key?key.split(','):[]
  if(!db||!missing.length)return
  let active=true
  loadCollectors(db,missing).then(found=>{if(active)setAuthors(previous=>new Map([...previous,...found]))}).catch(()=>{/* Cards still work without the author line. */})
  return ()=>{active=false}
 },[key])
 return authors
}

/** Same footprint as the real grid while the first page loads. */
export function ItemGridSkeleton({count=4}:{count?:number}){
 return <div className="cc-view-items cc-mode-galeria social-grid-skeleton" aria-hidden="true">{Array.from({length:count},(_,index)=><div key={index} className="cc-view-cell"><span className="skeleton-card"/></div>)}</div>
}
