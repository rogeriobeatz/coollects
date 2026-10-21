'use client'
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react'
import {flushSync} from 'react-dom'
import Link from 'next/link'
import {ChevronLeft,ChevronRight} from 'lucide-react'
import type {ItemRow} from '@/lib/catalog'
import {itemCardStyle} from '@/lib/item-card-theme'
import {CollectibleCard} from './collectible-card'

export type DeckItem={item:ItemRow;photoUrl:string|null;href:string}

function paintDepth(viewport:HTMLDivElement,stride:number){
 if(!stride)return
 const center=viewport.scrollLeft/stride
 viewport.querySelectorAll<HTMLElement>('[data-deck-position]').forEach(entry=>{
  const distance=Math.max(-2,Math.min(2,Number(entry.dataset.deckPosition)-center))
  entry.style.setProperty('--deck-distance',String(distance))
  entry.style.setProperty('--deck-depth',String(Math.abs(distance)))
  entry.style.zIndex=String(10-Math.round(Math.abs(distance)*3))
 })
}

export function ItemDeck<T extends {id:string}>({items,getItem}:{items:T[];getItem:(item:T)=>DeckItem}){
 const [position,setPosition]=useState(0)
 const [width,setWidth]=useState(0)
 const [height,setHeight]=useState(0)
 const region=useRef<HTMLDivElement>(null)
 const scroller=useRef<HTMLDivElement>(null)
 const pendingFocus=useRef<number|null>(null)
 const pendingScroll=useRef<number|null>(null)
 const resizing=useRef(false)
 const drag=useRef<{id:number;x:number;y:number;left:number;moved:boolean}|null>(null)
 const suppressClick=useRef(false)
 const active=Math.min(position,Math.max(0,items.length-1))
 const activeRef=useRef(active)
 activeRef.current=active
 const hasItems=items.length>0
 // Leave space for the overlapping neighbors instead of filling the viewport.
 const cardWidth=width?Math.min(340,width*.7):0
 const sidePadding=(width-cardWidth)/2
 const stride=cardWidth*.64
 const first=Math.max(0,Math.min(active-2,items.length-5))
 const visible=items.slice(first,first+5)
 useLayoutEffect(()=>{
  const viewport=scroller.current
  if(!viewport)return
  let measuredWidth=-1
  const measure=(synchronous=false)=>{
   if(viewport.clientWidth===measuredWidth)return
   measuredWidth=viewport.clientWidth
   resizing.current=true
   viewport.style.scrollSnapType='none'
   // Commit the new card positions before the browser re-snaps a focused card.
   if(synchronous)flushSync(()=>setWidth(measuredWidth))
   else setWidth(measuredWidth)
  }
  const observer=new ResizeObserver(()=>measure(true))
  measure()
  observer.observe(viewport)
  return()=>observer.disconnect()
 },[hasItems])
 useLayoutEffect(()=>{
  const viewport=scroller.current
  if(!viewport||!stride)return
  // Native snap and focus scrolling can arrive after ResizeObserver. Keep the
  // selected index authoritative until layout and the restored snap settle.
  resizing.current=true
  viewport.style.scrollSnapType='none'
  let frame=0,remaining=3
  const settle=()=>{
   viewport.scrollLeft=activeRef.current*stride
   if(--remaining===1)viewport.style.scrollSnapType='x mandatory'
   if(remaining>0)frame=requestAnimationFrame(settle)
   else resizing.current=false
  }
  settle()
  return()=>cancelAnimationFrame(frame)
 },[stride,items.length])
 useLayoutEffect(()=>{
  const cards=region.current?.querySelectorAll<HTMLElement>('.item-deck-art')
  if(!cards?.length)return
  const measure=()=>setHeight(Math.max(...Array.from(cards,card=>card.offsetHeight)))
  const observer=new ResizeObserver(measure)
  cards.forEach(card=>observer.observe(card))
  measure()
  return()=>observer.disconnect()
 },[first,cardWidth,items])
 useLayoutEffect(()=>{
  // Wait for the destination's five-card window before native snap selects it.
  if(pendingScroll.current===active){
   scroller.current?.scrollTo({left:active*stride,behavior:'instant'})
   pendingScroll.current=null
  }
 },[active,stride])
 useLayoutEffect(()=>{
  if(scroller.current)paintDepth(scroller.current,stride)
 },[first,active,stride])
 useEffect(()=>{
  if(pendingFocus.current===active){
   region.current?.querySelector<HTMLAnchorElement>('[data-deck-index="'+active+'"]')?.focus({preventScroll:true})
   pendingFocus.current=null
  }
 },[active])
 function goTo(next:number,focus=false){
  const target=Math.max(0,Math.min(items.length-1,next))
  if(target===active){
   scroller.current?.scrollTo({left:target*stride,behavior:'instant'})
   if(focus)region.current?.querySelector<HTMLAnchorElement>('[data-deck-index="'+target+'"]')?.focus({preventScroll:true})
   return
  }
  if(focus)pendingFocus.current=target
  pendingScroll.current=target
  setPosition(target)
 }
 if(!items.length)return null
 return <div className="cc-deck-area item-deck" ref={region} role="region" aria-label="Baralho de itens">
  <div className="item-deck-instruction"><strong>Explore seu baralho</strong><span>Deslize para ver os cards. Toque para ver o item.</span></div>
  <div className="item-deck-fan" ref={scroller} role="group" aria-label="Cartas com rolagem horizontal" style={{scrollSnapType:width?'x mandatory':'none'}} onPointerDown={event=>{
   suppressClick.current=false
   if(event.pointerType==='mouse'&&event.button===0)drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,moved:false}
  }} onPointerMove={event=>{
   const gesture=drag.current
   if(!gesture||event.pointerId!==gesture.id)return
   const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y
   if(!gesture.moved&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){
    gesture.moved=true
    suppressClick.current=true
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.style.scrollSnapType='none'
   }
   if(gesture.moved){event.preventDefault();event.currentTarget.scrollLeft=gesture.left-dx}
  }} onPointerUp={event=>{
   const gesture=drag.current
   drag.current=null
   if(!gesture?.moved)return
   if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
   event.currentTarget.style.scrollSnapType='x mandatory'
   goTo(Math.round(event.currentTarget.scrollLeft/stride))
  }} onPointerCancel={()=>{drag.current=null;suppressClick.current=true;if(scroller.current)scroller.current.style.scrollSnapType='x mandatory'}} onClickCapture={event=>{
   if(suppressClick.current&&event.detail>0){event.preventDefault();event.stopPropagation()}
  }} onScroll={event=>{
   // ResizeObserver must update the stride before interpreting a resized rail.
   if(resizing.current||event.currentTarget.clientWidth!==width)return
   paintDepth(event.currentTarget,stride)
   if(stride)setPosition(Math.max(0,Math.min(items.length-1,Math.round(event.currentTarget.scrollLeft/stride))))
  }} onKeyDown={event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
   event.preventDefault()
   goTo(event.key==='Home'?0:event.key==='End'?items.length-1:active+(event.key==='ArrowRight'?1:-1),true)
  }}>
   <div className="item-deck-track" style={{width:width+(items.length-1)*stride,height:height+60,'--deck-card-width':cardWidth+'px'} as CSSProperties}>
   {visible.map((entry,order)=>{
    const data=getItem(entry)
    const entryIndex=first+order
    return <div className={'item-deck-entry'+(entryIndex===active?' is-current':'')} key={entry.id} data-deck-position={entryIndex} style={{...itemCardStyle(data.item),left:sidePadding+entryIndex*stride}} role="group" aria-roledescription="carta" aria-label={(entryIndex+1)+' de '+items.length}>
     <div className="item-deck-layer">
     <div className="item-deck-art" aria-hidden="true"><CollectibleCard {...data} staticCard/></div>
     <Link href={data.href} draggable={false} className="item-deck-hit" data-deck-id={entry.id} data-deck-index={entryIndex} aria-label={'Ver item '+data.item.name} aria-current={entryIndex===active?'true':undefined} onFocus={event=>{if(entryIndex!==active&&event.currentTarget.matches(':focus-visible'))goTo(entryIndex)}}/>
     </div>
    </div>
   })}
   </div>
  </div>
  <div className="cc-deck-controls">
   <button type="button" aria-label="Carta anterior" disabled={active===0} onClick={()=>goTo(active-1)}><ChevronLeft size={21}/></button>
   <span aria-live="polite">{active+1} de {items.length}</span>
   <button type="button" aria-label="Próxima carta" disabled={active>=items.length-1} onClick={()=>goTo(active+1)}><ChevronRight size={21}/></button>
  </div>
 </div>
}
