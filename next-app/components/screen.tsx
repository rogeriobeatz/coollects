import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { MobileNav } from './mobile-nav'
export function Screen({title,subtitle,active,children}:{title:string;subtitle:string;active:'inicio'|'explorar'|'cadastrar'|'colecoes';children:React.ReactNode}) {
 return <main className="app-frame"><header className="topbar"><Link href="/" className="back" aria-label="Voltar ao início"><ArrowLeft size={22}/></Link><Link href="/" aria-label="Coollects — início"><BrandLogo/></Link></header><section className="content screen-content"><p className="eyebrow">COOLLECTS / {active.toUpperCase()}</p><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section><MobileNav active={active}/></main>
}
