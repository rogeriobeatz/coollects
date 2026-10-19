'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import {Grid2X2,Layers3,Gauge,Camera} from 'lucide-react'
import {ItemDeck,type DeckItem} from './item-deck'
import {useItemPresentation} from './item-presentation-provider'
export type ViewMode='galeria'|'baralho'
export function CollectionView<T extends {id:string}>({items,renderCard,getItem,storageKey,compact=false,toolbarStart}:{items:T[];renderCard:(item:T)=>ReactNode;getItem?:(item:T)=>DeckItem;storageKey:string;compact?:boolean;toolbarStart?:ReactNode}){
 const [mode,setMode]=useState<ViewMode>('galeria')
 const {focus,setFocus}=useItemPresentation()
 const deck=useRef<HTMLDivElement>(null)
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved==='galeria'||saved==='baralho')setMode(saved);else if(saved==='lista')localStorage.setItem(storageKey,'galeria')}catch{}},[storageKey])
 function switchMode(next:ViewMode){setMode(next);try{localStorage.setItem(storageKey,next)}catch{}}
 useEffect(()=>{
  if(mode!=='baralho')return
  const timer=requestAnimationFrame(()=>{
   deck.current?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
   deck.current?.querySelector<HTMLAnchorElement>('.item-deck-hit')?.focus({preventScroll:true})
  })
  return()=>cancelAnimationFrame(timer)
 },[mode])
 return <div className="collection-view">
  <div className={'collection-view-toolbar'+(compact?' collection-view-compact':'')}>
   {toolbarStart}
   <div className="collection-view-switch" role="group" aria-label="Visualizar itens">
    <button type="button" aria-label="Galeria" title="Galeria" aria-pressed={mode==='galeria'} onClick={()=>switchMode('galeria')}><Grid2X2 size={17}/><span>Galeria</span></button>
    {getItem&&<button type="button" aria-label="Baralho" title="Baralho" aria-pressed={mode==='baralho'} onClick={()=>switchMode('baralho')}><Layers3 size={17}/><span>Baralho</span></button>}
   </div>
  </div>
  <div className="item-focus-switch" role="group" aria-label="Conteúdo dos cards">
   <button type="button" aria-pressed={focus==='collector'} onClick={()=>setFocus('collector')}><Camera size={15}/>Colecionador</button>
   <button type="button" aria-pressed={focus==='gearhead'} onClick={()=>setFocus('gearhead')}><Gauge size={15}/>Gearhead <small>Ficha técnica</small></button>
  </div>
  {mode==='baralho'&&getItem?<div ref={deck} className="item-deck-anchor"><ItemDeck items={items} getItem={getItem}/></div>:<div className={'cc-view-items cc-mode-'+(mode==='baralho'?'galeria':mode)}>{items.map(item=><div key={item.id} className="cc-view-cell">{renderCard(item)}</div>)}</div>}
 </div>
}
