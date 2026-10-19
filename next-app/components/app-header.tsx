import Link from 'next/link'
import { ArrowLeft, UserRound } from 'lucide-react'
import { BrandLogo } from './brand-logo'

export function AppHeader({backHref,profileCurrent=false}:{backHref?:string;profileCurrent?:boolean}){
 return <header className="topbar app-header">
  {backHref&&<Link href={backHref} className="back" aria-label="Voltar"><ArrowLeft size={22}/></Link>}
  <Link href="/" className="screen-logo" aria-label="Coollects — início"><BrandLogo/></Link>
  <Link href="/perfil" className="header-profile-link" aria-label="Meu perfil" aria-current={profileCurrent?'page':undefined}><UserRound size={21}/></Link>
 </header>
}
