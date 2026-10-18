import type {ReactNode} from 'react'
import Link from 'next/link'
import {ImageIcon} from 'lucide-react'
import type {ItemRow} from '@/lib/catalog'
import {itemCardStyle,itemCardPalette} from '@/lib/item-card-theme'

type Props={
 item:ItemRow
 photoUrl:string|null
 href:string
 actions?:ReactNode
 footer?:ReactNode
}
export function CollectibleCard({item,photoUrl,href,actions,footer}:Props){
 const palette=itemCardPalette(item)
 return <article className="cc-item-card" style={itemCardStyle(item)}>
  <Link className="cc-item-cover" href={href} aria-label={'Ver ficha de '+item.name}>
   {photoUrl?<img src={photoUrl} alt={item.name} loading="lazy"/>:<span className="cc-item-no-photo"><ImageIcon size={32}/><small>Sem foto</small></span>}
  </Link>
  <div className="cc-item-info">
   <span className="cc-item-eyebrow">{item.brand||item.category}</span>
   <Link href={href} className="cc-item-title">{item.name}</Link>
   <div className="cc-item-foot"><span>{palette.label}</span>{actions}</div>
  </div>
  {footer}
 </article>
}
