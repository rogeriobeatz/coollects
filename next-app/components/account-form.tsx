'use client'
import { useState,type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter,useSearchParams } from 'next/navigation'
import { safeAuthNext } from '@/lib/auth-redirect'
import { authFailureMessage } from '@/lib/auth-failure'
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { getBrowserClient } from '@/lib/supabase/client'
export function AccountForm({mode}:{mode:'login'|'register'}){
 const router=useRouter()
 const params=useSearchParams()
 const destination=safeAuthNext(params.get('next'))
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [name,setName]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const register=mode==='register'
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  const client=getBrowserClient()
  if(!client){setMessage('O acesso está temporariamente indisponível. Tente novamente em alguns minutos.');return}
  if(password.length<8){setMessage('A senha deve ter pelo menos 8 caracteres.');return}
  if(register&&name.trim().length<2){setMessage('Informe um nome com pelo menos 2 caracteres.');return}
  setBusy(true);setMessage('')
  try{
   if(register){
    const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:name.trim()},emailRedirectTo:window.location.origin+'/auth/callback?next='+encodeURIComponent(destination)}})
    if(error)throw error
    if(data.session){router.replace(destination);router.refresh()}else setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.')
   }else{
    const {error}=await client.auth.signInWithPassword({email,password})
    if(error)throw error
    router.replace(destination);router.refresh()
   }
  }catch(error){setMessage(authFailureMessage(error,register?'register':'login'))}
  finally{setBusy(false)}
 }
 return <main className="auth-page"><div className="auth-brand"><Link href="/" aria-label="Coollects início"><BrandLogo/></Link><p>SUAS COLEÇÕES. SUAS HISTÓRIAS.</p><span aria-hidden="true">✳</span></div><div className="auth-sheet"><span className="auth-emblem">{register?<UserRound size={26}/>:<LockKeyhole size={26}/>}</span><h1>{register?'Comece seu':'Bem-vindo de'}<br/><em>{register?'universo.':'volta!'}</em></h1><p>{register?'Crie sua conta e guarde suas paixões em um só lugar.':'Seu acervo está esperando por você.'}</p><form onSubmit={submit}>
 {register&&<label className="field-label">Como podemos te chamar?<input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></label>}
 <label className="field-label">E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>
 <label className="field-label">Senha<input required minLength={8} type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres"/></label>
 <button disabled={busy} className="save-item-button">{busy?'Aguarde...':register?'Criar minha conta':'Entrar'} <ArrowRight size={19}/></button>
 </form>{message&&<p className="auth-message" role="status">{message}</p>}
 {!register&&params.get('erro')&&<p role="alert" className="auth-message">O link de acesso expirou ou não pôde ser confirmado. Solicite outro link ou entre novamente.</p>}
 {!register&&<Link href="/recuperar" className="auth-back">Esqueceu sua senha?</Link>}
 <div className="auth-toggle">{register?'Já tem uma conta?':'Ainda não tem conta?'} <Link href={(register?'/entrar':'/registrar')+'?next='+encodeURIComponent(destination)}>{register?'Entrar':'Cadastre-se'}</Link></div>
 <Link className="auth-back" href="/">Voltar para o Coollects</Link><p className="auth-legal">Ao continuar, confira nossa <Link href="/privacidade">política de privacidade</Link> e nossos <Link href="/termos">termos</Link>.</p></div></main>
}
