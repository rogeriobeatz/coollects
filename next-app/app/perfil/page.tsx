import type { Metadata } from 'next'
import { UserRound,ArrowRight,LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { Screen } from '@/components/screen'
export const metadata:Metadata={title:'Meu perfil'}
export default function ProfilePage(){return <Screen active="inicio" title="Seu" accent="perfil." subtitle="Sua identidade como colecionador."><section className="profile-preview"><span className="profile-avatar"><UserRound size={42}/></span><h2>Uma história para contar.</h2><p>Perfis públicos e login chegarão com a integração do banco de dados. Seus dados locais continuam privados neste navegador.</p><span className="profile-badge"><LockKeyhole size={16}/> Em desenvolvimento</span><Link href="/colecoes" className="pill-btn">Ver minhas coleções <ArrowRight size={17}/></Link></section></Screen>}
