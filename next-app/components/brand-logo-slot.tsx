'use client'
import {useState} from 'react'
function slugify(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
export function BrandLogoSlot({value,kind}:{value:string;kind:'miniaturas'|'montadoras'}){
 const [failedSrc,setFailedSrc]=useState<string|null>(null)
 const [loadedSrc,setLoadedSrc]=useState<string|null>(null)
 const label=value.trim()
 const slug=slugify(label)
 const src='/brand-logos/'+kind+'/'+slug+'.png'
 if(!slug||['marca','montadora','na','n-a','nenhuma','nenhum','nao-informado','nao-informada'].includes(slug)||failedSrc===src)return null
 return <span className={'cc-brand-slot'+(loadedSrc===src?' is-loaded':'')} data-kind={kind} title={(kind==='montadoras'?'Montadora: ':'Marca: ')+label}>
  <img src={src} alt={label} loading="lazy" onLoad={()=>setLoadedSrc(src)} onError={()=>setFailedSrc(src)}/>
 </span>
}
