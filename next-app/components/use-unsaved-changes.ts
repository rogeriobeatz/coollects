'use client'
import {useEffect,useRef} from 'react'

/** Guard unloads; app navigation can remain free when a provider retains the draft. */
export function useUnsavedChanges(dirty:boolean,allowNavigation=false){
 const current=useRef(dirty)
 const navigationAllowed=useRef(allowNavigation)
 navigationAllowed.current=allowNavigation
 current.current=dirty
 useEffect(()=>{
  const unload=(event:BeforeUnloadEvent)=>{if(current.current){event.preventDefault();event.returnValue=''}}
  const click=(event:MouseEvent)=>{
   if(navigationAllowed.current||!current.current||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
   const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null
   if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return
   const destination=new URL(anchor.href,location.href)
   if(destination.href===location.href||destination.pathname===location.pathname&&destination.search===location.search)return
   if(!window.confirm('Descartar as alterações que ainda não foram salvas?')){event.preventDefault();event.stopPropagation()}
  }
  window.addEventListener('beforeunload',unload)
  document.addEventListener('click',click,true)
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true)}
 },[])
 return ()=>{current.current=false}
}
