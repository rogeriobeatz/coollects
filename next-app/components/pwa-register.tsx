'use client'
import { useEffect } from 'react'
export function PwaRegister(){
 useEffect(()=>{if('serviceWorker' in navigator && location.protocol==='https:'){
  void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{/* offline é opcional */})
 }},[])
 return null
}
