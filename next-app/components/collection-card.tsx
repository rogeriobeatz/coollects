import type {ReactNode} from 'react'
import Link from 'next/link'
import {LockKeyhole,Globe2} from 'lucide-react'
import type {CollectionRow} from '@/lib/catalog'
import {collectionUrlPath} from '@/lib/catalog'
import {CollectionMosaic} from './collection-mosaic'
export function CollectionCard({collection,count,author,actions,href}:{collection:CollectionRow;count?:number;author?:string;actions?:ReactNode;href?:string}){
 return <article className="unified-collection-card">
  <Link href={href||collectionUrlPath(collection.id)} className="unified-collection-link" aria-label={'Abrir coleção '+collection.name}>
   <CollectionMosaic id={collection.id} coverId={collection.cover_item_id}/>
   <div className="unified-collection-info"><strong>{collection.name}</strong><span>{typeof count==='number'?count+' '+(count===1?'item':'itens'):collection.category}</span>
   {author&&<span>por {author}</span>}</div>
  </Link>
  <span className="unified-visibility">{collection.is_public?<><Globe2 size={15}/> Pública</>:<><LockKeyhole size={15}/> Privada</>}</span>
  {actions&&<div className="unified-collection-actions">{actions}</div>}
 </article>
}
