import type {ReactNode} from 'react'
import Link from 'next/link'
import {ImageIcon} from 'lucide-react'
import type {ItemRow} from '@/lib/catalog'
type Props={item:ItemRow;photoUrl:string|null;href:string;actions?:ReactNode;footer?:ReactNode}
export function CollectibleCard({item,photoUrl,href,actions,footer}:Props){
 const descriptor=[item.brand||item.category,item.details?.series].filter(Boolean).join(' · ')
 return <article className="cc-item-card">
  <Link className="cc-item-cover" href={href} aria-label={'Ver ficha de '+item.name}>
   {photoUrl?<img src={photoUrl} alt={item.name} loading="lazy"/>:<span className="cc-item-no-photo"><ImageIcon size={32}/><span>Sem foto</span></span>}
  </Link>
  {actions&&<div className="cc-item-overlay-actions">{actions}</div>}
  <div className="cc-item-info"><Link href={href} className="cc-item-title">{item.name}</Link>{descriptor&&<p className="cc-item-meta">{descriptor}</p>}</div>
  {footer}
 </article>
}
