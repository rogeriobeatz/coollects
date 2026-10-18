'use client'
import {useEffect,useState} from 'react'
export function TopBarTitle({fallback}:{fallback:string}){
 const [label,setLabel]=useState(fallback)
 useEffect(()=>{setLabel(fallback);const update=(e:Event)=>{const text=(e as CustomEvent<string>).detail;if(typeof text==='string'&&text.trim())setLabel(text.trim())};window.addEventListener('coollects:page-title',update);return()=>window.removeEventListener('coollects:page-title',update)},[fallback])
 return <span>{label}</span>
}
