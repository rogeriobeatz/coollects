'use client'

import { useState,type CSSProperties,type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { CollectionRow } from '@/lib/catalog'
import { safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
import { CollectionBadge } from './collection-badge'
import type { CollectionPhoto } from '@/lib/collection-previews'

type Props = {
 collection: Pick<CollectionRow, 'name' | 'category' | 'emoji' | 'color'>
 href?: string
 meta?: string
 photos?: CollectionPhoto[]
 showcase?: boolean
 hero?: boolean
 controls?: ReactNode
 className?: string
}

/** Shared artwork: 5:3 in lists and previews, compact as a detail banner. */
export function CollectionCard({ collection, href, meta, photos=[], showcase=false, hero=false, controls, className = '' }: Props) {
 const [failedPhotos,setFailedPhotos]=useState<string[]>([])
 const gallery=photos.filter(photo=>!failedPhotos.includes(photo.src)).slice(0,2)
 const content = <>
  <div className="collector-collection-art"><CategoryArt category={collection.category} emoji={collection.emoji}/></div>
  {gallery.length>0&&<div className={'collection-teaser-gallery collection-teaser-'+gallery.length}>{gallery.map(photo=><img key={photo.src} src={photo.src} alt={photo.name} loading={hero?'eager':'lazy'} onError={()=>setFailedPhotos(current=>[...current,photo.src])}/>)}</div>}
  <CollectionBadge/>
  {!hero&&<span className="collection-card-category">{collection.category}</span>}
  <div className="collector-collection-label">
   {hero&&<span className="collection-card-category">{collection.category}</span>}
   {hero?<h1>{collection.name}</h1>:<strong>{collection.name}</strong>}
   {meta && <small>{meta}</small>}
  </div>
  {showcase&&!hero&&<span className="collection-open-arrow" aria-hidden="true"><ArrowUpRight size={21}/></span>}
 </>
 const artworkClass='collector-collection-card'+(showcase||hero?' collection-showcase':'')+(hero?' collection-hero':'')+(gallery.length?' has-photos':'')
 return <article className={'collection-card-shell '+(hero?'collection-hero-shell ':'') + className} style={{ '--poster-accent': safeColor(collection.color) } as CSSProperties}>
  {href ? <Link href={href} className={artworkClass} aria-label={collection.name}>{content}</Link>
   : <div className={artworkClass}>{content}</div>}
  {hero&&controls&&<div className="collection-hero-controls">{controls}</div>}
 </article>
}
