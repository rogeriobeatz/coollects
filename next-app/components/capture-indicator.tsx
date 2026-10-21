'use client'
import {useEffect,useId,useState,type CSSProperties} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ArrowUpRight,Check,ImageIcon,Sparkles,TriangleAlert} from 'lucide-react'
import {analysisProgress} from './analysis-progress'
import type {CaptureSession} from './capture-provider'

/** One in-memory draft, visible across app routes until saved or discarded. */
export function CaptureIndicator({draft}:{draft:CaptureSession}){
 const pathname=usePathname()
 const {analysis,hasDraft,userId,preparing,saving}=draft
 const [now,setNow]=useState(()=>Date.now())
 const descriptionId=useId()
 const saved=!hasDraft&&draft.lastSaved
 const visible=Boolean(userId&&(hasDraft||saved)&&pathname!=='/cadastrar')
 const working=preparing>0||draft.busy||saving
 useEffect(()=>{
  if(!visible||!draft.busy)return
  setNow(Date.now())
  const timer=window.setInterval(()=>setNow(Date.now()),1000)
  return()=>window.clearInterval(timer)
 },[visible,draft.busy,analysis.startedAt])
 if(!visible)return null
 const done=analysis.status==='done',failed=analysis.status==='error'
 const title=saved?'Item salvo':saving?'Salvando item':preparing?'Preparando foto':draft.busy?'Reconhecendo foto':done?'Pronto para revisar':failed?'Reconhecimento interrompido':'Cadastro em andamento'
 const progress=analysisProgress(Math.max(0,now-analysis.startedAt),analysis.status==='finishing'||done)
 const subtitle=saved?'Toque para ver a ficha':draft.busy?'Estimativa '+progress+'% · toque para voltar':done?'Revise a ficha antes de salvar':failed?'Toque para tentar novamente':'Toque para retomar a ficha'
 const Icon=saved||done?Check:failed?TriangleAlert:working?Sparkles:ImageIcon
 const href=saved?'/item/'+encodeURIComponent(saved.id):'/cadastrar'+(draft.preferredCollection?'?colecao='+encodeURIComponent(draft.preferredCollection):'')
 return <>
  <p className="visually-hidden" role="status">{saved?'Item salvo no seu acervo.':done?'Reconhecimento concluído. Volte ao cadastro para revisar e salvar.':failed?'O reconhecimento não foi concluído. Seu cadastro foi preservado.':title}</p>
  <Link href={href} className={'capture-indicator'+(working?' is-working':'')+(done||saved?' is-ready':'')+(failed?' is-error':'')} aria-label={saved?'Ver item salvo':'Retomar cadastro — '+title} aria-describedby={descriptionId} style={{'--capture-progress':progress+'%'} as CSSProperties}>
   <span className="capture-indicator-symbol" aria-hidden="true"><Icon size={23}/></span>
   <span className="capture-indicator-copy"><strong>{title}</strong><small id={descriptionId}>{subtitle}</small></span>
   <ArrowUpRight size={18} aria-hidden="true"/>
  </Link>
 </>
}
