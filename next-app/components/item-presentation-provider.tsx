'use client'
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react'
import type { ItemFocus } from '@/lib/item-presentation'
const key='coollects-item-focus-v1'
const Context=createContext<{focus:ItemFocus;setFocus:(focus:ItemFocus)=>void}>({focus:'collector',setFocus:()=>{}})
export function ItemPresentationProvider({children}:{children:ReactNode}){
 const [focus,setValue]=useState<ItemFocus>('collector')
 useEffect(()=>{
  try{if(localStorage.getItem(key)==='gearhead')setValue('gearhead')}catch{}
  function sync(event:StorageEvent){if(event.key===key)setValue(event.newValue==='gearhead'?'gearhead':'collector')}
  window.addEventListener('storage',sync)
  return ()=>window.removeEventListener('storage',sync)
 },[])
 function setFocus(next:ItemFocus){setValue(next);try{localStorage.setItem(key,next)}catch{}}
 return <Context.Provider value={{focus,setFocus}}>{children}</Context.Provider>
}
export function useItemPresentation(){return useContext(Context)}
