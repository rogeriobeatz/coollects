'use client'
import {useState,type ReactNode} from 'react'
import Link from 'next/link'
import {LockKeyhole,Globe2} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import {collectionUrlPath,publicUrlPath,type CollectionRow,type ProfileRow} from '@/lib/catalog'
import {CollectionMosaic} from './collection-mosaic'
export function CollectionCard({collection,count,author,actions,href}:{collection:CollectionRow;count?:number;author?:ProfileRow;actions?:ReactNode;href?:string}){
 const [actualCount,setActualCount]=useState<number|null>(null)
 const displayCount=typeof count==='number'?count:actualCount
 const avatar=author?.avatar_path?getBrowserClient()?.storage.from('coollects-avatars').getPublicUrl(author.avatar_path).data.publicUrl:null
 return <article className="unified-collection-card">
  <Link href={href||collectionUrlPath(collection.id)} className="unified-collection-link" aria-label={'Abrir coleção '+collection.name}>
   <CollectionMosaic id={collection.id} coverId={collection.cover_item_id} onCount={setActualCount}/>
   <div className="unified-collection-info"><strong>{collection.name}</strong><span>{typeof displayCount==='number'?displayCount+' '+(displayCount===1?'item':'itens'):collection.category}</span></div>
  </Link>
  <div className="unified-collection-footer">
   {author?<Link href={publicUrlPath(author.username)} className="unified-author" aria-label={'Ver perfil de '+author.display_name}>
    {avatar?<img src={avatar} alt=""/>:<span className="unified-author-fallback">{author.display_name.slice(0,1).toUpperCase()}</span>}
    <span>@{author.username}</span>
   </Link>:null}
   <span className="unified-visibility">{collection.is_public?<><Globe2 size={16}/> Pública</>:<><LockKeyhole size={16}/> Privada</>}</span>
  </div>
  {actions&&<div className="unified-collection-actions">{actions}</div>}
 </article>
}
