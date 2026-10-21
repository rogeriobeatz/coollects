'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,Check,LogOut,UserRound } from 'lucide-react'
import { CollectorAvatar } from './collector-avatar'
import { AuthGate } from './auth-gate'
import { LegacyImport } from './legacy-import'
import { AccountDeletion } from './account-deletion'
import { getBrowserClient } from '@/lib/supabase/client'
import { clearImageCache } from '@/lib/images'
import { ProfileRow } from '@/lib/catalog'
import { useRouter } from 'next/navigation'
export function ProfileWorkspace(){return <AuthGate>{userId=><ProfileEditor userId={userId}/>}</AuthGate>}
function ProfileEditor({userId}:{userId:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[displayName,setDisplayName]=useState(''),[username,setUsername]=useState(''),[bio,setBio]=useState('')
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const router=useRouter()
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  void Promise.resolve(db.from('profiles').select('*').eq('id',userId).single()).then(({data,error})=>{
   if(!active)return
   if(error){setMessage('Não conseguimos carregar o perfil agora. Tente novamente.');return}
   if(data){const p=data as ProfileRow;setProfile(p);setDisplayName(p.display_name);setUsername(p.username);setBio(p.bio)}
  }).catch(()=>{if(active)setMessage('Não conseguimos carregar o perfil agora. Tente novamente.')})
  return ()=>{active=false}
 },[userId])
 async function save(){
  if(displayName.trim().length<2||!/^[a-z0-9_]{3,30}$/.test(username)){setMessage('Nome com pelo menos 2 caracteres; usuário de 3 a 30 letras minúsculas, números ou _.');return}
  if(busy)return
  const db=getBrowserClient()
  if(!db){setMessage('Serviço indisponível. Tente novamente.');return}
  setBusy(true);setMessage('')
  try{
   const {error}=await db.from('profiles').update({display_name:displayName.trim(),username,bio:bio.trim()}).eq('id',userId)
   if(error){setMessage('Não foi possível atualizar o perfil. O nome de usuário pode já estar em uso.');return}
   setProfile(p=>p?{...p,display_name:displayName.trim(),username,bio:bio.trim()}:p)
   setMessage('Perfil atualizado!')
  }catch{setMessage('Não foi possível atualizar o perfil. Verifique sua conexão e tente novamente.')}
  finally{setBusy(false)}
 }
 async function signOut(){
  const db=getBrowserClient();if(!db){setMessage('Serviço indisponível. Tente novamente.');return}
  setBusy(true)
  try{
   const {error}=await db.auth.signOut()
   if(error){setMessage('Não foi possível encerrar sua sessão. Tente novamente.');return}
   // The global SIGNED_OUT listener also clears; await here before navigating.
   await clearImageCache()
   router.replace('/');router.refresh()
  }catch{setMessage('Não foi possível encerrar sua sessão. Tente novamente.')}
  finally{setBusy(false)}
 }
 return <div className="profile-preview profile-editor">
  {profile?<CollectorAvatar name={profile.display_name||profile.username} seed={profile.id} size="lg"/>:<span className="profile-avatar"><UserRound size={42}/></span>}
  <h2>{profile?.display_name||'Seu universo'}</h2>
  <p>{profile?'@'+profile.username:'Personalize seu perfil público e compartilhe suas coleções.'}</p>
  <label className="field-label">Nome de exibição<input maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
  <label className="field-label">Usuário (URL pública)<input maxLength={30} value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}/></label>
  <label className="field-label">Biografia<textarea rows={3} maxLength={300} value={bio} onChange={e=>setBio(e.target.value)}/></label>
  <button className="save-item-button" disabled={busy||!profile} onClick={()=>void save()}><Check size={18}/>{busy?'Salvando...':'Salvar perfil'}</button>
  {message&&<p role="status" className="scan-notice">{message}</p>}
  <div className="profile-links">
   {profile&&<Link href="/perfil">Ver meu perfil <ArrowRight size={16}/></Link>}
   <Link href="/itens">Gerenciar meus itens <ArrowRight size={16}/></Link>
   <button disabled={busy} onClick={()=>void signOut()}>Sair da conta <LogOut size={16}/></button>
  </div>
  <LegacyImport userId={userId}/>
  <AccountDeletion/>
  <p className="local-note">Apenas coleções que você marcar como públicas ficarão visíveis para visitantes. Seguidores e curtidas são públicos. Seu e-mail nunca aparece no perfil.</p>
 </div>
}
