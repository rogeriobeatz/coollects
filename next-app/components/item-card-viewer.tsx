'use client'
import {useState} from 'react'
import {Rotate3D,Layers3,Gauge} from 'lucide-react'
import type {ItemRow} from '@/lib/catalog'
import {itemCardStyle} from '@/lib/item-card-theme'
import {miniatureSpecs,type ItemFocus} from '@/lib/item-presentation'
import {ItemCardContent} from './collectible-card'
import {useItemPresentation} from './item-presentation-provider'

export function ItemCardViewer({item,photoUrl,headingLevel='h3'}:{item:ItemRow;photoUrl:string|null;headingLevel?:'h1'|'h3'}){
 const {focus}=useItemPresentation()
 const [face,setFace]=useState<ItemFocus>(focus)
 const back=face==='gearhead'
 const specs=miniatureSpecs(item)
 return <div className="item-card-viewer">
  <div className={'item-flip-scene'+(back?' is-flipped':'')} style={itemCardStyle(item)}>
   <div className="item-flip-inner">
    <article className="cc-item-card cc-focus-collector item-flip-face item-flip-front" aria-hidden={back} inert={back}>
     <ItemCardContent item={item} photoUrl={photoUrl} face="collector" headingLevel={headingLevel}/>
    </article>
    <article className="cc-item-card cc-focus-gearhead item-flip-face item-flip-back" aria-hidden={!back} inert={!back}>
     <ItemCardContent item={item} photoUrl={null} face="gearhead" headingLevel={headingLevel}/>
    </article>
   </div>
  </div>
  <div className="item-face-controls" role="group" aria-label="Lado do card">
   <button type="button" aria-pressed={!back} onClick={()=>setFace('collector')}><Layers3 size={16}/>Colecionador</button>
   <button type="button" aria-pressed={back} onClick={()=>setFace('gearhead')}><Gauge size={16}/>{item.category==='Miniaturas'?'Gearhead':'Ficha'}</button>
   <button type="button" className="item-flip-button" aria-label="Virar card" title="Virar card" onClick={()=>setFace(back?'collector':'gearhead')}><Rotate3D size={20}/></button>
  </div>
  {!back&&specs.length>0&&<details className="item-miniature-specs"><summary>Ficha da miniatura <span>{specs.length} detalhes</span></summary><dl>{specs.map(spec=><div key={spec.key}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></details>}
 </div>
}
