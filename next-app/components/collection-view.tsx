'use client'
import {useEffect,useState,type ReactNode} from 'react'
import {Grid2X2,List} from 'lucide-react'
export type ViewMode='galeria'|'lista'
export function CollectionView<T extends {id:string}>({items,renderCard,storageKey}:{items:T[];renderCard:(item:T)=>ReactNode;storageKey:string}){
 const [mode,setMode]=useState<ViewMode>('galeria')
 useEffect(()=>{try{setMode(window.localStorage.getItem(storageKey)==='lista'?'lista':'galeria')}catch{}},[storageKey])
 function change(next:ViewMode){setMode(next);try{window.localStorage.setItem(storageKey,next)}catch{}}
 return <div className="collection-view">
  <div className="collection-view-toolbar"><div className="collection-view-switch" role="group" aria-label="Visualizar itens">
   <button type="button" aria-label="Visualizar em grade" title="Grade" aria-pressed={mode==='galeria'} onClick={()=>change('galeria')}><Grid2X2 size={21}/></button>
   <button type="button" aria-label="Visualizar em lista" title="Lista" aria-pressed={mode==='lista'} onClick={()=>change('lista')}><List size={21}/></button>
  </div></div>
  <div className={'cc-view-items cc-mode-'+mode}>{items.map(item=><div key={item.id} className="cc-view-cell">{renderCard(item)}</div>)}</div>
 </div>
}
