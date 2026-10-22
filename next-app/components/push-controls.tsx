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
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[testing,setTesting]=useState(false),[message,setMessage]=useState('')
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
   // Permission must be requested directly from the tap, before any awaits on iOS.
   if(!enabled){
    if(!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)throw new Error('O envio de notificações ainda não foi configurado.')
    if(Notification.permission==='denied')throw new Error('Autorize as notificações nas configurações do navegador.')
    const permission=await Notification.requestPermission()
    if(permission!=='granted')throw new Error('Você não autorizou as notificações.')
   }
   const registration=await navigator.serviceWorker.ready
   let subscription=await registration.pushManager.getSubscription()
   if(enabled){
    if(subscription){const endpoint=subscription.endpoint;await fetch('/api/push/subscriptions',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint})});await subscription.unsubscribe()}
    setEnabled(false);setMessage('Notificações desativadas neste aparelho.');return
   }
   if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeVapid(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)})
   const res=await fetch('/api/push/subscriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(subscription.toJSON())})
   if(!res.ok)throw new Error('Não foi possível registrar este aparelho. Tente novamente.')
   setEnabled(true);setMessage('Pronto! Você receberá curtidas e novos seguidores.')
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível ativar as notificações.')}
  finally{setBusy(false)}
 }
 async function testPush(){
  setTesting(true);setMessage('Enviando notificação de teste…')
  try{
   const response=await fetch('/api/push/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'test'})})
   const result=await response.json().catch(()=>({reason:'invalid_response'})) as {ok?:boolean;sent?:number;reason?:string;providerStatuses?:number[];diagnostics?:string[]}
   if(!response.ok||!result.ok)throw new Error('Falha no envio ('+response.status+'): '+(result.reason||'erro desconhecido')+(result.providerStatuses?.length?' · Apple HTTP '+result.providerStatuses.join(', '):'')+(result.diagnostics?.length?' · '+result.diagnostics.join(', '):''))
   setMessage('Notificação enviada ao serviço push ('+result.sent+' dispositivo(s)). Confira os avisos do celular.')
  }catch(e){setMessage(e instanceof Error?e.message:'Falha no teste push.')}
  finally{setTesting(false)}
 }
 return <div className="push-controls">
  <strong><Bell size={16}/> Notificações no celular</strong>
  <p>{blocked?'No iPhone, adicione o Coollects à Tela de Início e abra pelo ícone para ativar as notificações.':!supported?'Este navegador não oferece notificações push.':'Receba curtidas e novos seguidores mesmo com o aplicativo fechado.'}</p>
  <button type="button" className="pill-btn" disabled={!supported||blocked||busy} onClick={()=>void toggle()}>{enabled?<><BellOff size={16}/> Desativar notificações</>:<><Bell size={16}/> {busy?'Configurando…':'Ativar notificações'}</>}</button>
  {enabled&&<button type="button" className="pill-btn" disabled={testing||busy} onClick={()=>void testPush()}><Bell size={16}/> {testing?'Testando…':'Enviar notificação de teste'}</button>}
  {message&&<p role="status">{message}</p>}
 </div>
}
