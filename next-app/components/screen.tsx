import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { MobileNav } from './mobile-nav'
export function Screen({title,accent,subtitle,active,children,variant='light',backHref='/',compact=false}:{title:string;accent?:string;subtitle:string;backHref?:string;compact?:boolean;active:'inicio'|'explorar'|'cadastrar'|'colecoes'|'perfil';children:React.ReactNode;variant?:'light'|'dark'}) {
 return <main className={'app-frame screen-'+variant}>
 <header className="topbar"><Link href={backHref} className="back" aria-label="Voltar"><ArrowLeft size={22}/></Link><Link href="/" className="screen-logo" aria-label="Coollects — início"><BrandLogo/></Link></header>
 {!compact&&<section className="screen-intro"><p className="kicker">{active==='explorar'?'UM MUNDO DE DESCOBERTAS':active==='colecoes'?'DO SEU JEITO':active==='perfil'?'VOCÊ NO COOLLECTS':'SEU PRÓXIMO TESOURO'}</p><h1>{title}{accent&&<><br/><span>{accent}</span></>}</h1><p>{subtitle}</p><span className="intro-doodle" aria-hidden="true">✳</span></section>}
 <div className={'screen-body'+(compact?' screen-body-compact':'')}>{children}</div><MobileNav active={active}/></main>
}
