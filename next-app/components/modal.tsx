'use client'

import {useEffect,useRef,type ReactNode} from 'react'

/** Native modality keeps keyboard focus inside and makes the background inert. */
export function Modal({label,onClose,children,busy=false,initialFocus,returnFocus}:{
 label:string;onClose:()=>void;children:ReactNode;busy?:boolean;initialFocus?:string;returnFocus?:string
}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{
  const dialog=ref.current
  if(!dialog)return
  const origin=document.activeElement instanceof HTMLElement?document.activeElement:null
  dialog.showModal()
  if(initialFocus)dialog.querySelector<HTMLElement>(initialFocus)?.focus()
  return()=>{
   dialog.close()
   // Contextual menu entries can disappear while opening the dialog.
   const target=returnFocus?document.querySelector<HTMLElement>(returnFocus):null
   if(origin?.isConnected&&origin!==document.body)origin.focus({preventScroll:true})
   else target?.focus({preventScroll:true})
  }
 },[initialFocus,returnFocus])
 return <dialog ref={ref} className="edit-overlay native-modal" aria-label={label} onKeyDown={event=>{
  if(event.key!=='Tab')return
  const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:enabled,input:enabled:not([type="hidden"]),select:enabled,textarea:enabled,a[href],summary,[tabindex="0"]'))
   .filter(el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[inert]'))
  const first=controls[0],last=controls[controls.length-1]
  if(!first){event.preventDefault();return}
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }} onCancel={event=>{
  event.preventDefault()
  if(!busy)onClose()
 }} onClick={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>{children}</dialog>
}
