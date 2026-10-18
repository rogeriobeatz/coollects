'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import {ChevronLeft,ChevronRight,Grid2X2,List,Layers3} from 'lucide-react'
export type ViewMode='galeria'|'lista'|'baralho'
export function CollectionView({items,renderCard,storageKey}:{items:{id:string}[];renderCard:(item:any)=>ReactNode;storageKey:string}){
 const [mode,setMode]=useState<ViewMode>('galeria')
 const [active,setActive]=useState(0)
 const startX=useRef<number|null>(null)
 useEffect(()=>{try{const saved=window.localStorage.getItem(storageKey);if(saved==='galeria'||saved==='lista'||saved==='baralho')setMode(saved)}catch{}},[storageKey])
 function switchMode(next:ViewMode){setMode(next);setActive(0);try{window.localStorage.setItem(storageKey,next)}catch{}}
 const index=Math.min(active,Math.max(0,items.length-1))
 const selected=items[index]
 const change=(step:number)=>setActive(v=>Math.max(0,Math.min(items.length-1,v+step)))
 return <div className="collection-view">
  <div className="collection-view-toolbar" aria-label="Modo de visualização">
   <div className="collection-view-switch" role="group" aria-label="Visualizar itens">
    <button type="button" aria-pressed={mode==='galeria'} onClick={()=>switchMode('galeria')}><Grid2X2 size={17}/> Galeria</button>
    <button type="button" aria-pressed={mode==='lista'} onClick={()=>switchMode('lista')}><List size={17}/> Lista</button>
    <button type="button" aria-pressed={mode==='baralho'} onClick={()=>switchMode('baralho')}><Layers3 size={17}/> Baralho</button>
   </div>
  </div>
  {mode==='baralho'&&selected?<div className="cc-deck-area">
   <p className="cc-deck-hint">Deslize para descobrir a próxima carta</p>
   <div className="cc-deck-stage" onTouchStart={e=>{startX.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>{const current=e.changedTouches[0]?.clientX;if(startX.current!==null&&current!==undefined){const dx=current-startX.current;if(Math.abs(dx)>45)change(dx<0?1:-1)}startX.current=null}}>
    <div className="cc-deck-shadow cc-deck-shadow-third" aria-hidden="true"/>
    <div className="cc-deck-shadow cc-deck-shadow-second" aria-hidden="true"/>
    <div key={selected.id} className="cc-deck-active">{renderCard(selected)}</div>
   </div>
   <div className="cc-deck-controls"><button type="button" disabled={index===0} onClick={()=>change(-1)} aria-label="Carta anterior"><ChevronLeft size={21}/></button><span aria-live="polite">{index+1} de {items.length}</span><button type="button" disabled={index===items.length-1} onClick={()=>change(1)} aria-label="Próxima carta"><ChevronRight size={21}/></button></div>
  </div>:<div className={'cc-view-items cc-mode-'+mode}>{items.map(item=><div key={item.id} className="cc-view-cell">{renderCard(item)}</div>)}</div>}
 </div>
}
