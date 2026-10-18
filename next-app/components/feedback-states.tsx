import type {ReactNode} from 'react'
import {PackageOpen} from 'lucide-react'
export function EmptyState({title,description,action,icon}:{title:string;description?:string;action?:ReactNode;icon?:ReactNode}){
 return <div className="ux-empty-state" role="status"><span className="ux-empty-icon">{icon||<PackageOpen size={38}/>}</span><h2>{title}</h2>{description&&<p>{description}</p>}{action}</div>
}
export function CardSkeleton({count=4}:{count?:number}){
 return <div className="ux-skeleton-grid" role="status" aria-label="Carregando itens">
  {Array.from({length:count},(_,i)=><div className="ux-skeleton-card" key={i}><div className="ux-skeleton-image"/><div className="ux-skeleton-line"/><div className="ux-skeleton-line short"/></div>)}
  <span className="visually-hidden">Carregando itens…</span>
 </div>
}
