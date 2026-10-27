'use client'
import {useEffect,useState} from 'react'
import {Camera,MessageCircle,PartyPopper,X} from 'lucide-react'
import Link from 'next/link'
import {getBrowserClient} from '@/lib/supabase/client'

const RELEASE='comments-and-profile-photo-20261027'
export function ReleaseAnnouncement({userId}:{userId:string}){
 const [show,setShow]=useState(false)
 const [busy,setBusy]=useState(false)
 useEffect(()=>{
  let active=true
  // Persistent per account, including across devices. No redisplay when offline.
  const check=async()=>{
   const db=getBrowserClient();if(!db)return
   const {data,error}=await db.from('user_announcements_seen').select('announcement_key').eq('user_id',userId).eq('announcement_key',RELEASE).maybeSingle()
   if(active&&!error&&!data)setShow(true)
  }
  void check()
  return ()=>{active=false}
 },[userId])
 async function close(){
  if(busy)return
  const db=getBrowserClient()
  if(!db)return
  setBusy(true)
  const {error}=await db.from('user_announcements_seen').upsert({user_id:userId,announcement_key:RELEASE},{onConflict:'user_id,announcement_key'})
  if(!error)setShow(false)
  setBusy(false)
 }
 if(!show)return null
 return <div className="release-backdrop" role="presentation">
  <section className="release-modal" role="dialog" aria-modal="true" aria-labelledby="release-title" aria-describedby="release-copy">
   <button type="button" className="release-close" onClick={()=>void close()} disabled={busy} aria-label="Fechar novidades"><X size={20}/></button>
   <span className="release-illustration"><PartyPopper size={28}/></span>
   <small className="release-kicker">NOVIDADES NO COOLLECTS</small>
   <h2 id="release-title">Sua coleção ficou mais social!</h2>
   <p id="release-copy">Tem novidade para deixar seu universo ainda mais seu.</p>
   <div className="release-feature"><MessageCircle size={21}/><span><strong>Comentários nas peças</strong><small>Converse com outros colecionadores sobre os itens publicados.</small></span></div>
   <div className="release-feature"><Camera size={21}/><span><strong>Foto de perfil</strong><small>Mostre quem está por trás da coleção.</small></span></div>
   <Link href="/perfil/editar" className="release-cta" onClick={()=>void close()}>Personalizar meu perfil</Link>
   <button type="button" className="release-later" disabled={busy} onClick={()=>void close()}>Entendi, vamos colecionar!</button>
  </section>
 </div>
}
