'use client'
import { useEffect,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { ArrowRight,Check,Copy,LogOut,UserRound } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { LegacyImport } from './legacy-import'
import { AccountDeletion } from './account-deletion'
import { getBrowserClient } from '@/lib/supabase/client'
import { ProfileRow,publicUrlPath } from '@/lib/catalog'
import {validateImageFile} from '@/lib/images'
import { useRouter } from 'next/navigation'
export function ProfileWorkspace(){return <AuthGate>{userId=><ProfileEditor userId={userId}/>}</AuthGate>}
function ProfileEditor({userId}:{userId:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[displayName,setDisplayName]=useState(''),[username,setUsername]=useState(''),[bio,setBio]=useState('')
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [availability,setAvailability]=useState('')
 const [avatarBusy,setAvatarBusy]=useState(false)
 const router=useRouter()
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  void db.from('profiles').select('*').eq('id',userId).single().then(({data,error})=>{
   if(!active)return
   if(error){setMessage('Não conseguimos carregar o perfil agora. Tente novamente.');return}
   if(data){const p=data as ProfileRow;setProfile(p);setDisplayName(p.display_name);setUsername(p.username);setBio(p.bio)}
  })
  return ()=>{active=false}
 },[userId])
 useEffect(()=>{if(!profile||username===profile.username||username.length<3){setAvailability('');return}const timer=setTimeout(()=>{const db=getBrowserClient();if(!db)return;void Promise.all([db.from('profiles').select('id').eq('username',username).neq('id',userId).maybeSingle(),db.from('profile_username_aliases').select('profile_id').eq('username',username).neq('profile_id',userId).maybeSingle()]).then(([a,b])=>setAvailability(a.error||b.error?'Não foi possível verificar a disponibilidade.':a.data||b.data?'Nome de usuário indisponível.':'Nome de usuário disponível.'))},350);return()=>clearTimeout(timer)},[username,profile,userId])
 async function uploadAvatar(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value=''
  if(!file||avatarBusy)return
  const db=getBrowserClient();if(!db)return
  if(file.size>2*1024*1024){setMessage('Escolha uma fotografia de até 2 MB.');return}
  setAvatarBusy(true);setMessage('')
  let path:string|null=null
  try{
   const mime=await validateImageFile(file)
   const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
   path=userId+'/'+crypto.randomUUID()+'.'+ext
   const {error:uploadError}=await db.storage.from('coollects-avatars').upload(path,file,{contentType:mime,upsert:false})
   if(uploadError)throw new Error('Não foi possível enviar o avatar.')
   const {error:profileError}=await db.from('profiles').update({avatar_path:path}).eq('id',userId)
   if(profileError){await db.storage.from('coollects-avatars').remove([path]);throw new Error('Não foi possível salvar seu avatar.')}
   const old=profile?.avatar_path
   setProfile(p=>p?{...p,avatar_path:path}:p)
   setMessage('Avatar atualizado!')
   if(old&&old.startsWith(userId+'/'))void db.storage.from('coollects-avatars').remove([old])
  }catch(error){setMessage(error instanceof Error?error.message:'Não foi possível atualizar o avatar.')}
  finally{setAvatarBusy(false)}
 }

 async function save(){
  if(availability==='Nome de usuário indisponível.'){setMessage('Escolha outro nome de usuário.');return}
  if(displayName.trim().length<2||!/^[a-z0-9_-]{3,30}$/.test(username)){setMessage('Nome com pelo menos 2 caracteres; usuário de 3 a 30 letras minúsculas, números, _ ou hífen.');return}
  setBusy(true);const db=getBrowserClient();if(!db)return
  const {error}=await db.from('profiles').update({display_name:displayName.trim(),username,bio:bio.trim()}).eq('id',userId)
  setMessage(error?'Não foi possível atualizar o perfil. O nome de usuário pode já estar em uso.':'Perfil atualizado!')
  if(!error)setProfile(p=>p?{...p,display_name:displayName.trim(),username,bio:bio.trim()}:p)
  setBusy(false)
 }
 async function signOut(){const db=getBrowserClient();if(!db){setMessage('Serviço indisponível. Tente novamente.');return}setBusy(true);const {error}=await db.auth.signOut();setBusy(false);if(error){setMessage('Não foi possível encerrar sua sessão. Tente novamente.');return}router.replace('/');router.refresh()}
 async function share(){
  if(!profile)return
  const url=location.origin+publicUrlPath(profile.username)
  try{await navigator.clipboard.writeText(url);setMessage('Link do perfil copiado!')}catch{setMessage(url)}
 }
 return <div className="profile-preview"><label className="profile-avatar avatar-editor" title="Alterar avatar">{profile?.avatar_path?<img className="public-avatar-image" alt="Seu avatar" src={getBrowserClient()?.storage.from("coollects-avatars").getPublicUrl(profile.avatar_path).data.publicUrl}/>:<UserRound size={42}/>}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Alterar avatar" disabled={avatarBusy} onChange={e=>void uploadAvatar(e)} /></label><h2>{profile?.display_name||'Seu universo'}</h2><p>Personalize seu perfil público e compartilhe suas coleções.</p>
  <label className="field-label">Nome de exibição<input maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
  <label className="field-label">Usuário (URL pública)<input maxLength={30} value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,''))}/></label>
  {availability&&<p role="status" className="username-availability">{availability}</p>}
  <label className="field-label">Biografia<textarea rows={3} maxLength={300} value={bio} onChange={e=>setBio(e.target.value)}/></label>
  <button className="save-item-button" disabled={busy||!profile} onClick={()=>void save()}><Check size={18}/>{busy?'Salvando...':'Salvar perfil'}</button>
  {message&&<p role="status" className="scan-notice">{message}</p>}
  <div className="profile-links">
   {profile&&<><Link href={publicUrlPath(profile.username)}>Ver perfil público <ArrowRight size={16}/></Link><button onClick={()=>void share()}>Copiar link <Copy size={16}/></button></>}
   <Link href="/itens">Gerenciar meus itens <ArrowRight size={16}/></Link>
   <button disabled={busy} onClick={()=>void signOut()}>Sair da conta <LogOut size={16}/></button>
  </div>
  <LegacyImport userId={userId}/>
  <AccountDeletion/>
  <p className="local-note">Apenas coleções que você marcar como públicas ficarão visíveis para visitantes. Seu e-mail nunca aparece no perfil.</p>
 </div>
}
