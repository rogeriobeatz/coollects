'use client'
import {useState} from 'react'
import type {ReactNode} from 'react'
import Link from 'next/link'
import {LockKeyhole,Globe2} from 'lucide-react'
import type {CollectionRow,ProfileRow} from '@/lib/catalog'
import {collectionUrlPath} from '@/lib/catalog'
import {CollectionMosaic} from './collection-mosaic'
export function CollectionCard({collection,count,author,actions,href}:{collection:CollectionRow;count?:number;author?:ProfileRow;actions?:ReactNode;href?:string}){
 const [actualCount,setActualCount]=useState<number|null>(null)
 const displayCount=typeof count==='number'?count:actualCount
 return <article className="unified-collection-card">
  <Link href={href||collectionUrlPath(collection.id)} className="unified-collection-link" aria-label={'Abrir coleção '+collection.name}>
   <CollectionMosaic id={collection.id} coverId={collection.cover_item_id} onCount={setActualCount}/>
   <div className="unified-collection-info"><strong>{collection.name}</strong><span>{typeof displayCount==='number'?displayCount+' '+(displayCount===1?'item':'itens'):collection.category}</span>
   {author&&<span className="collection-author">@{author.username}</span>}</div>
  </Link>
  <span className="unified-visibility">{collection.is_public?<><Globe2 size={15}/> Pública</>:<><LockKeyhole size={15}/> Privada</>}</span>
  {actions&&<div className="unified-collection-actions">{actions}</div>}
 </article>
}
