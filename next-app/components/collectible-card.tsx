'use client'

import {useState,type ReactNode} from 'react'
import Link from 'next/link'
import {ImageIcon,Gauge,Layers3,ArrowUpRight} from 'lucide-react'
import {BrandLogoSlot} from './brand-logo-slot'
import {useItemPresentation} from './item-presentation-provider'
import type {ItemRow} from '@/lib/catalog'
import {itemCardStyle} from '@/lib/item-card-theme'
import {itemValue,miniatureSpecs,vehicleSpecs,type ItemFocus} from '@/lib/item-presentation'

type Props={item:ItemRow;photoUrl:string|null;href:string;actions?:ReactNode;footer?:ReactNode;focus?:ItemFocus;staticCard?:boolean}

/** One item artwork across home, library, collections, deck and detail. */
export function CollectibleCard({item,photoUrl,href,actions,footer,focus,staticCard=false}:Props){
 const preference=useItemPresentation()
 const face=focus??preference.focus
 return <article className={'cc-item-card cc-focus-'+face} style={itemCardStyle(item)} data-item-id={item.id}>
  <ItemCardContent item={item} photoUrl={photoUrl} face={face} href={staticCard?undefined:href} actions={staticCard?undefined:actions}/>
  {footer}
 </article>
}

export function ItemCardContent({item,photoUrl,face,href,actions,headingLevel='h3'}:{
 item:ItemRow;photoUrl:string|null;face:ItemFocus;href?:string;actions?:ReactNode;headingLevel?:'h1'|'h3'
}){
 const [failedPhoto,setFailedPhoto]=useState<string|null>(null)
 const brand=itemValue(item.brand),manufacturer=itemValue(item.details?.manufacturer)
 const mini=item.category==='Miniaturas'
 const scale=itemValue(item.details?.scale)
 const Heading=headingLevel
 const name=face==='gearhead'&&mini?(itemValue(item.details?.vehicleModel)||item.name):item.name
 const title=href?<Link className="cc-item-title" href={href} title={name}>{name}</Link>:<Heading className="cc-item-title">{name}</Heading>
 if(face==='gearhead'){
  const specs=mini?vehicleSpecs(item):miniatureSpecs(item)
  return <div className="cc-technical-face">
   <div className="cc-technical-top"><span>{mini?'GEARHEAD / VEÍCULO':'FICHA / COLECIONÁVEL'}</span><Gauge size={16} aria-hidden="true"/>{actions&&<div className="cc-item-actions">{actions}</div>}</div>
   <div className="cc-technical-identity">
    {mini&&manufacturer?<><BrandLogoSlot value={manufacturer} kind="montadoras"/><p className="cc-manufacturer">{manufacturer}</p></>:<Layers3 size={29} aria-hidden="true"/>}
    {title}
    {!mini&&brand&&<p className="cc-manufacturer">{brand}</p>}
    {mini&&itemValue(item.details?.vehicleYear)&&<span className="cc-vehicle-year">{itemValue(item.details?.vehicleYear)}</span>}
   </div>
   {specs.filter(spec=>spec.key!=='vehicleYear').length?<dl className="cc-technical-specs">{specs.filter(spec=>spec.key!=='vehicleYear').map(spec=><div key={spec.key}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl>:<p className="cc-technical-empty">{mini?'Os dados técnicos deste veículo ainda não foram cadastrados.':'Mais detalhes ficam disponíveis na ficha do item.'}</p>}
   {mini&&itemValue(item.details?.vehicleSource)&&<p className="cc-spec-source">Fonte: {itemValue(item.details?.vehicleSource)}</p>}
   <div className="cc-card-signature"><span>{mini?'FICHA DO VEÍCULO':item.category}</span><strong>coollects</strong></div>
  </div>
 }
 const photo=<>{photoUrl&&failedPhoto!==photoUrl?<img src={photoUrl} alt={item.name} loading="lazy" onError={()=>setFailedPhoto(photoUrl)}/>:<span className="cc-item-no-photo"><ImageIcon size={32} aria-hidden="true"/><small>Sem foto</small></span>}
  {brand&&<span className="cc-photo-brand"><BrandLogoSlot value={brand} kind="miniaturas"/></span>}
  <span className="cc-photo-category"><Layers3 size={11} aria-hidden="true"/>{scale||item.category}</span></>
 const series=itemValue(item.details?.series)
 const chips=[itemValue(item.details?.seriesNumber),itemValue(item.details?.collectionNumber)].filter(Boolean)
 return <>
  <div className="cc-item-visual">{href?<Link className="cc-item-cover" href={href} aria-label={'Ver ficha de '+item.name}>{photo}</Link>:<div className="cc-item-cover">{photo}</div>}</div>
  <div className="cc-item-info">
   <div className="cc-card-eyebrow"><span>{brand||item.category}</span>{actions&&<div className="cc-item-actions">{actions}</div>}</div>
   {title}
   <div className="cc-card-subline">{manufacturer&&<span className="cc-model-make">{manufacturer}</span>}{series&&<span>{series}</span>}</div>
   <div className="cc-card-footer">
    {chips.length>0&&<div className="cc-mini-chips">{chips.map((chip,index)=><span key={index}>{chip}</span>)}</div>}
    <div className="cc-card-signature"><span>{itemValue(item.details?.year)?'CARTELA '+itemValue(item.details?.year):chips.length?'':'COLECIONÁVEL'}</span>{href?<ArrowUpRight size={14} aria-hidden="true"/>:<strong>coollects</strong>}</div>
   </div>
  </div>
 </>
}
