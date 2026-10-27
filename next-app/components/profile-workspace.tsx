'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,Check,LogOut,Trash2,UserRound } from 'lucide-react'
import { CollectorAvatar,notifyAvatarUpdated } from './collector-avatar'
import { AuthGate } from './auth-gate'
import { LegacyImport } from './legacy-import'
import { AccountDeletion } from './account-deletion'
import { PhoneRegistration } from './phone-registration'
import { getBrowserClient } from '@/lib/supabase/client'
import { clearImageCache } from '@/lib/images'
import {preparePhoto} from '@/lib/photo-preparation'
import { ProfileRow } from '@/lib/catalog'
import { useRouter } from 'next/navigation'
import {useUnsavedChanges} from './use-unsaved-changes'
export function ProfileWorkspace(){return <AuthGate>{userId=><ProfileEditor userId={userId}/>}</AuthGate>}
function ProfileEditor({userId}:{userId:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null),[displayName,setDisplayName]=useState(''),[username,setUsername]=useState(''),[bio,setBio]=useState('')
 const [phoneSaved,setPhoneSaved]=useState(false)
 const [avatarBusy,setAvatarBusy]=useState(false)
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [loadFailed,setLoadFailed]=useState(false),[attempt,setAttempt]=useState(0)
 useUnsavedChanges(Boolean(profile&&(displayName!==profile.display_name||username!==profile.username||bio!==profile.bio))&&!busy)
 const router=useRouter()
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setLoadFailed(true);return}
  setLoadFailed(false);setMessage('')
  let active=true
  void Promise.resolve(db.from('profiles').select('*').eq('id',userId).single()).then(({data,error})=>{
   if(!active)return
   if(error||!data){setLoadFailed(true);return}
   if(data){const p=data as ProfileRow;setProfile(p);setDisplayName(p.display_name);setUsername(p.username);setBio(p.bio)}
  }).catch(()=>{if(active)setLoadFailed(true)})
  void db.from('user_contact_numbers').select('user_id').eq('user_id',userId).maybeSingle().then(({data})=>{if(active)setPhoneSaved(Boolean(data))})
  return ()=>{active=false}
 },[userId,attempt])
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
 async function uploadAvatar(file:File|undefined){
  if(!file||!profile||avatarBusy)return
  const db=getBrowserClient();if(!db)return
  setAvatarBusy(true);setMessage('')
  let uploadedPath:string|null=null
  try{
   const prepared=await preparePhoto(file)
   const mime=prepared.file.type
   if(mime!=='image/webp'&&mime!=='image/jpeg')throw Error('Unsupported image format')
   const path=userId+'/'+crypto.randomUUID()+(mime==='image/webp'?'.webp':'.jpg')
   const result=await db.storage.from('coollects-avatars').upload(path,prepared.file,{contentType:mime,upsert:false,cacheControl:'3600'})
   if(result.error)throw result.error
   uploadedPath=path
   const {error:updateError}=await db.from('profiles').update({avatar_path:path}).eq('id',userId)
   if(updateError)throw updateError
   const previous=profile.avatar_path
   setProfile(p=>p?{...p,avatar_path:path}:p)
   notifyAvatarUpdated(userId)
   if(previous&&previous.startsWith(userId+'/'))void db.storage.from('coollects-avatars').remove([previous])
   setMessage('Foto de perfil atualizada!')
  }catch{
   if(uploadedPath)void db.storage.from('coollects-avatars').remove([uploadedPath])
   setMessage('Não conseguimos salvar a foto. Tente outra imagem JPG, PNG ou HEIC.')
  }finally{setAvatarBusy(false)}
 }
 async function removeAvatar(){
  if(!profile?.avatar_path||avatarBusy)return
  const db=getBrowserClient();if(!db)return
  setAvatarBusy(true);setMessage('')
  try{
   const {error}=await db.from('profiles').update({avatar_path:null}).eq('id',userId)
   if(error)throw error
   const path=profile.avatar_path
   setProfile(p=>p?{...p,avatar_path:null}:p)
   notifyAvatarUpdated(userId)
   if(path.startsWith(userId+'/'))void db.storage.from('coollects-avatars').remove([path])
   setMessage('Foto removida. Suas iniciais aparecerão no perfil.')
  }catch{setMessage('Não foi possível remover a foto.')}
  finally{setAvatarBusy(false)}
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
  <div className="profile-avatar-editor">
   {profile?<CollectorAvatar name={profile.display_name||profile.username} seed={profile.id} size="lg"/>:<span className="profile-avatar"><UserRound size={42}/></span>}
   <label className="profile-avatar-upload"><Camera size={16}/> {avatarBusy?'Enviando…':'Adicionar ou trocar foto'}<input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" disabled={avatarBusy||!profile} onChange={e=>{const file=e.target.files?.[0];e.target.value='';void uploadAvatar(file)}}/></label>
   {profile?.avatar_path&&<button type="button" className="profile-avatar-remove" disabled={avatarBusy} onClick={()=>void removeAvatar()}><Trash2 size={14}/> Remover foto</button>}
  </div>
  <h2>{profile?.display_name||'Seu universo'}</h2>
  <p>{profile?'@'+profile.username:'Personalize seu perfil público e compartilhe suas coleções.'}</p>
  {loadFailed&&<div role="alert" className="scan-notice">Não conseguimos carregar o perfil agora. <button type="button" onClick={()=>setAttempt(v=>v+1)}>Tentar novamente</button></div>}
  <label className="field-label">Nome de exibição<input maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
  <label className="field-label">Usuário (URL pública)<input maxLength={30} value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}/></label>
  <label className="field-label">Biografia<textarea rows={3} maxLength={300} value={bio} onChange={e=>setBio(e.target.value)}/></label>
  <button className="save-item-button" disabled={busy||!profile} onClick={()=>void save()}><Check size={18}/>{busy?'Salvando...':'Salvar perfil'}</button>
  {message&&<p role="status" className="scan-notice">{message}</p>}
  <section className="profile-phone"><h3>Celular cadastral</h3>{phoneSaved?<p className="scan-notice">Celular já cadastrado. Seu número não é público nem será usado para mensagens sem autorização.</p>:<PhoneRegistration userId={userId} compact onSaved={()=>setPhoneSaved(true)}/>}</section>
  <div className="profile-links">
   {profile&&<Link href="/perfil">Ver meu perfil <ArrowRight size={16}/></Link>}
   <Link href="/itens">Gerenciar meus itens <ArrowRight size={16}/></Link>
   <a href="mailto:contato@coollects.com.br">Ajuda e privacidade <ArrowRight size={16}/></a>
   <button disabled={busy} onClick={()=>void signOut()}>Sair da conta <LogOut size={16}/></button>
  </div>
  <LegacyImport userId={userId}/>
  <AccountDeletion/>
  <p className="local-note">Apenas coleções que você marcar como públicas ficarão visíveis para visitantes. Seguidores e curtidas são públicos. Seu e-mail e celular nunca aparecem no perfil.</p>
 </div>
}
