'use client'
import { useState,type FormEvent } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { getBrowserClient } from '@/lib/supabase/client'
export default function RecoverPage(){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 async function submit(e:FormEvent){e.preventDefault();const db=getBrowserClient();if(!db){setMessage('O acesso está temporariamente indisponível. Tente novamente mais tarde.');return}setBusy(true);const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/auth/callback?next=/redefinir'});setBusy(false);setMessage(error?'Não foi possível solicitar o e-mail.':'Se existir uma conta com esse e-mail, enviaremos um link para redefinir sua senha.')}
 return <main className="auth-page"><div className="auth-brand"><BrandLogo/></div><div className="auth-sheet"><h1>Esqueceu a<br/><em>senha?</em></h1><p>Solicite um link para escolher uma nova senha.</p><form onSubmit={submit}><label className="field-label">E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="save-item-button" disabled={busy}>{busy?'Enviando…':'Enviar link de recuperação'}</button></form>{message&&<p role="status" className="auth-message">{message}</p>}<Link href="/entrar" className="auth-back">Voltar ao login</Link></div></main>
}
