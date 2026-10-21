'use client'
import { useEffect,useState } from 'react'
import { AuthGate } from './auth-gate'
import { PublicProfile } from './public-profile'
import { EmptyIllustration } from './empty-illustration'
import { getBrowserClient } from '@/lib/supabase/client'

/** The Perfil tab: the collector's own public profile, with owner actions. */
export function OwnProfile(){return <AuthGate>{userId=><OwnProfileLoader userId={userId}/>}</AuthGate>}

function OwnProfileLoader({userId}:{userId:string}){
 const [username,setUsername]=useState<string|null>(null)
 const [failed,setFailed]=useState(false)
 const [attempt,setAttempt]=useState(0)
 useEffect(()=>{
  const db=getBrowserClient()
  if(!db){setFailed(true);return}
  let active=true
  setFailed(false)
  void db.from('profiles').select('username').eq('id',userId).maybeSingle().then(({data,error})=>{
   if(!active)return
   if(error||!data?.username){setFailed(true);return}
   setUsername(data.username as string)
  })
  return ()=>{active=false}
 },[userId,attempt])
 if(failed)return <div className="empty-collection-panel" role="alert"><EmptyIllustration kind="unavailable"/><h2>Não foi possível abrir seu perfil.</h2><p>Verifique sua conexão e tente de novo.</p><button type="button" className="pill-btn" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></div>
 if(!username)return <div className="collector-profile" aria-busy="true" aria-label="Carregando perfil"><div className="collector-hero is-skeleton"><span className="collector-avatar avatar-lg"/><i/><i/></div></div>
 return <PublicProfile username={username}/>
}
