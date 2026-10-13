'use client'
import { useState,type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { getBrowserClient } from '@/lib/supabase/client'
export function AccountForm({mode}:{mode:'login'|'register'}){
 const router=useRouter()
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [name,setName]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const register=mode==='register'
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  const client=getBrowserClient()
  if(!client){setMessage('Supabase ainda não foi configurado.');return}
  if(password.length<8){setMessage('A senha deve ter pelo menos 8 caracteres.');return}
  if(register&&name.trim().length<2){setMessage('Informe um nome com pelo menos 2 caracteres.');return}
  setBusy(true);setMessage('')
  try{
   if(register){
    const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:name.trim()},emailRedirectTo:window.location.origin+'/auth/callback?next=/perfil'}})
    if(error)throw error
    if(data.session){router.replace('/perfil');router.refresh()}else setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.')
   }else{
    const {error}=await client.auth.signInWithPassword({email,password})
    if(error)throw error
    router.replace('/perfil');router.refresh()
   }
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível autenticar.')}
  finally{setBusy(false)}
 }
 return <main className="auth-page"><div className="auth-brand"><Link href="/" aria-label="Coollects início"><BrandLogo/></Link><p>SUAS COLEÇÕES. SUAS HISTÓRIAS.</p><span aria-hidden="true">✳</span></div><div className="auth-sheet"><span className="auth-emblem">{register?<UserRound size={26}/>:<LockKeyhole size={26}/>}</span><h1>{register?'Comece seu':'Bem-vindo de'}<br/><em>{register?'universo.':'volta!'}</em></h1><p>{register?'Crie sua conta e guarde suas paixões em um só lugar.':'Seu acervo está esperando por você.'}</p><form onSubmit={submit}>
 {register&&<label className="field-label">Como podemos te chamar?<input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>}
 <label className="field-label">E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
 <label className="field-label">Senha<input required minLength={8} type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres"/></label>
 <button disabled={busy} className="save-item-button">{busy?'Aguarde...':register?'Criar minha conta':'Entrar'} <ArrowRight size={19}/></button>
 </form>{message&&<p className="auth-message" role="status">{message}</p>}
 <div className="auth-toggle">{register?'Já tem uma conta?':'Ainda não tem conta?'} <Link href={register?'/entrar':'/registrar'}>{register?'Entrar':'Cadastre-se'}</Link></div>
 <Link className="auth-back" href="/">Voltar para o Coollects</Link></div></main>
}
