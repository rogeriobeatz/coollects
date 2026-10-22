'use client'
import {useEffect,useState} from 'react'
import {Bell,BellOff} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'

function decodeVapid(base64url:string){
 const pad='='.repeat((4-base64url.length%4)%4)
 const raw=atob((base64url+pad).replace(/-/g,'+').replace(/_/g,'/'))
 return Uint8Array.from(raw,letter=>letter.charCodeAt(0))
}
export function isInstalledPwa(){
 if(typeof window==='undefined')return false
 return window.matchMedia('(display-mode: standalone)').matches||('standalone' in navigator&&(navigator as Navigator&{standalone?:boolean}).standalone===true)
}
export function isIos(){return typeof navigator!=='undefined'&&/iPad|iPhone|iPod/.test(navigator.userAgent)}
export function PushControls(){
 const {user}=useAccount()
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const supported=typeof window!=='undefined'&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window
 useEffect(()=>{
  if(!user||!supported){setEnabled(false);return}
  let active=true
  void navigator.serviceWorker.ready.then(r=>r.pushManager.getSubscription()).then(s=>{if(active)setEnabled(Boolean(s)&&Notification.permission==='granted')}).catch(()=>{})
  return ()=>{active=false}
 },[user?.id,supported])
 if(!user)return null
 const blocked=isIos()&&!isInstalledPwa()
 async function toggle(){
  if(!supported||blocked||busy)return
  setBusy(true);setMessage('')
  try{
   const registration=await navigator.serviceWorker.ready
   let subscription=await registration.pushManager.getSubscription()
   if(enabled){
    if(subscription){const endpoint=subscription.endpoint;await fetch('/api/push/subscriptions',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint})});await subscription.unsubscribe()}
    setEnabled(false);setMessage('Notificações desativadas neste aparelho.');return
   }
   if(!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)throw new Error('O envio de notificações ainda não foi configurado.')
   if(Notification.permission==='denied')throw new Error('Autorize as notificações nas configurações do navegador.')
   const permission=await Notification.requestPermission()
   if(permission!=='granted')throw new Error('Você não autorizou as notificações.')
   if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeVapid(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)})
   const res=await fetch('/api/push/subscriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(subscription.toJSON())})
   if(!res.ok)throw new Error('Não foi possível registrar este aparelho. Tente novamente.')
   setEnabled(true);setMessage('Pronto! Você receberá curtidas e novos seguidores.')
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível ativar as notificações.')}
  finally{setBusy(false)}
 }
 return <div className="push-controls">
  <strong><Bell size={16}/> Notificações no celular</strong>
  <p>{blocked?'No iPhone, adicione o Coollects à Tela de Início e abra pelo ícone para ativar as notificações.':!supported?'Este navegador não oferece notificações push.':'Receba curtidas e novos seguidores mesmo com o aplicativo fechado.'}</p>
  <button type="button" className="pill-btn" disabled={!supported||blocked||busy} onClick={()=>void toggle()}>{enabled?<><BellOff size={16}/> Desativar notificações</>:<><Bell size={16}/> {busy?'Configurando…':'Ativar notificações'}</>}</button>
  {message&&<p role="status">{message}</p>}
 </div>
}
