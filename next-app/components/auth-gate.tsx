'use client'
import Link from 'next/link'
import { LockKeyhole,WifiOff } from 'lucide-react'
import { useAccount } from '@/hooks/use-account'
import { usePathname,useSearchParams } from 'next/navigation'
export function AuthGate({children}:{children:(userId:string)=>React.ReactNode}){
 const {user,loading,configured}=useAccount()
 const pathname=usePathname()
 const params=useSearchParams()
 const next=pathname+(params.size?'?'+params.toString():'')
 if(loading)return <div className="auth-alert" role="status">Carregando sua conta…</div>
 if(!configured)return <div className="auth-alert"><WifiOff size={27}/><h2>Voltamos em instantes</h2><p>Não conseguimos conectar sua conta agora. Tente novamente mais tarde.</p></div>
 if(!user)return <div className="auth-alert"><LockKeyhole size={27}/><h2>Entre para salvar seu acervo</h2><p>Com uma conta, suas coleções ficam sincronizadas entre dispositivos.</p><Link href={"/entrar?next="+encodeURIComponent(next)} className="pill-btn">Entrar ou cadastrar</Link></div>
 return <>{children(user.id)}</>
}
