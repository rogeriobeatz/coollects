'use client'

import { useEffect,useState } from 'react'
import { CheckCircle2,Info,TriangleAlert,X } from 'lucide-react'

export type NoticeKind='info'|'success'|'error'

/** Informational feedback fades after five seconds; actionable errors remain. */
export function FeedbackNotice({message,kind='info'}:{message:string;kind?:NoticeKind}){
 const [visible,setVisible]=useState(true)
 useEffect(()=>{
  setVisible(true)
  if(kind==='error')return
  const timer=window.setTimeout(()=>setVisible(false),5000)
  return ()=>window.clearTimeout(timer)
 },[message,kind])
 if(!visible||!message)return null
 const Icon=kind==='error'?TriangleAlert:kind==='success'?CheckCircle2:Info
 return <div className={'feedback-notice feedback-'+kind} role={kind==='error'?'alert':'status'}>
  <Icon size={19} aria-hidden="true"/><p>{message}</p>
  <button type="button" onClick={()=>setVisible(false)} aria-label="Fechar aviso"><X size={18}/></button>
 </div>
}
