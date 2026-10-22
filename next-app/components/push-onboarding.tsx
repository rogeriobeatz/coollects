'use client'
import {useEffect,useState} from 'react'
import {Download,Share2,SquarePlus,X} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {usePathname} from 'next/navigation'
import {isInstalledPwa,isIos} from './push-controls'
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}
const KEY='coollects-install-dismissed-v1'
export function PushOnboarding(){
 const {user,loading}=useAccount()
 const pathname=usePathname()
 const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null)
 const [show,setShow]=useState(false)
 const [ios,setIos]=useState(false)
 useEffect(()=>{
  const handler=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPromptEvent)}
  window.addEventListener('beforeinstallprompt',handler)
  return ()=>window.removeEventListener('beforeinstallprompt',handler)
 },[])
 useEffect(()=>{
  if(loading||!user||pathname!=='/'||isInstalledPwa())return
  setIos(isIos())
  try{
   if(localStorage.getItem(KEY))return
   const visits=Number(localStorage.getItem('coollects-install-visits')||'0')+1
   localStorage.setItem('coollects-install-visits',String(visits))
   if(visits>=2)setShow(true)
  }catch{/* Storage can be unavailable in private browsing. */}
 },[loading,user?.id,pathname])
 if(!show||!user||isInstalledPwa()||(!ios&&!prompt))return null
 async function install(){
  if(prompt){await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')dismiss();setPrompt(null)}
 }
 function dismiss(){setShow(false);try{localStorage.setItem(KEY,'1')}catch{}}
 return <div className="install-modal-backdrop" role="presentation"><section className="install-modal" role="dialog" aria-modal="true" aria-label="Instalar Coollects">
  <button className="install-dismiss" type="button" onClick={dismiss} aria-label="Agora não"><X size={20}/></button>
  <img src="/brand/icon-192.png?v=2" width="60" height="60" alt="Ícone Coollects"/>
  <h2>Leve suas coleções no bolso</h2><p>Instale o Coollects na Tela de Início e ative os avisos de curtidas e novos seguidores.</p>
  {ios?<div className="install-instructions">
   <p><Share2 size={18}/> 1. Toque em <strong>Compartilhar</strong> no navegador.</p>
   <p><SquarePlus size={18}/> 2. Selecione <strong>Adicionar à Tela de Início</strong>.</p>
   <p><Download size={18}/> 3. Abra o Coollects pelo novo ícone e ative as notificações.</p>
   <small>Essa opção pode aparecer em posições diferentes no Safari e no Chrome.</small>
  </div>:<button type="button" className="pill-btn" onClick={()=>void install()}><Download size={18}/> Instalar aplicativo</button>}
  <button type="button" className="text-btn" onClick={dismiss}>Agora não</button>
 </section></div>
}
