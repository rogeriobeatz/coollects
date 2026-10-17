'use client'
import { useState,type FormEvent } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAccount } from '@/hooks/use-account'
export default function NewPasswordPage(){
 const {user,loading}=useAccount();const [password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[updated,setUpdated]=useState(false)
 async function submit(e:FormEvent){e.preventDefault();if(password.length<8)return setMessage('Use pelo menos 8 caracteres.');if(password!==confirmPassword)return setMessage('As senhas não coincidem.');const db=getBrowserClient();if(!db)return;setBusy(true);const {error}=await db.auth.updateUser({password});setBusy(false);setMessage(error?'Não foi possível atualizar a senha. Solicite outro link e tente novamente.':'Senha atualizada com sucesso!');if(!error){setUpdated(true);setPassword('');setConfirmPassword('')}}
 return <main className="auth-page"><div className="auth-brand"><BrandLogo/></div><div className="auth-sheet"><h1>Uma nova<br/><em>senha.</em></h1>{loading?<p>Verificando link…</p>:updated?<p>Sua senha foi alterada. Você já pode continuar.</p>:user?<form onSubmit={submit}><label className="field-label">Nova senha<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="field-label">Confirme a nova senha<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label><button className="save-item-button" disabled={busy}>{busy?'Atualizando…':'Salvar nova senha'}</button></form>:<p>O link expirou ou não é válido. Solicite uma nova recuperação.</p>}{message&&<p role="status" className="auth-message">{message}</p>}<Link href={user?'/perfil':'/recuperar'} className="auth-back">{user?'Ir para o perfil':'Solicitar outro link'}</Link></div></main>
}
