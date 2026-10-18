'use client'
import {useEffect,useState} from 'react'
function slugify(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
export function BrandLogoSlot({value,kind}:{value:string;kind:'miniaturas'|'montadoras'}){
 const [failed,setFailed]=useState(false)
 const slug=slugify(value)
 useEffect(()=>setFailed(false),[slug,kind])
 if(!slug)return <span className="cc-brand-slot cc-brand-placeholder" aria-label={kind==='montadoras'?'Montadora não informada':'Marca não informada'}>{kind==='montadoras'?'MONTADORA':'MARCA'}</span>
 const src='/brand-logos/'+kind+'/'+slug+'.png'
 return <span className="cc-brand-slot" title={value}>{!failed?<img src={src} alt={value} loading="lazy" onError={()=>setFailed(true)}/>:<span className="cc-brand-fallback">{value}</span>}</span>
}
