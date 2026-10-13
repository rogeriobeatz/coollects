'use client'
import Link from 'next/link'
import { LockKeyhole,Settings2 } from 'lucide-react'
import { useAccount } from '@/hooks/use-account'
export function AuthGate({children}:{children:(userId:string)=>React.ReactNode}){
 const {user,loading,configured}=useAccount()
 if(loading)return <div className="auth-alert" role="status">Carregando sua conta…</div>
 if(!configured)return <div className="auth-alert"><Settings2 size={27}/><h2>Configure o Supabase</h2><p>Falta conectar o banco e a autenticação. Veja o guia de implantação no repositório.</p></div>
 if(!user)return <div className="auth-alert"><LockKeyhole size={27}/><h2>Entre para salvar seu acervo</h2><p>Com uma conta, suas coleções ficam sincronizadas entre dispositivos.</p><Link href="/entrar" className="pill-btn">Entrar ou cadastrar</Link></div>
 return <>{children(user.id)}</>
}
