import Link from 'next/link'
import {ArrowLeft} from 'lucide-react'
import {BrandLogo} from './brand-logo'
import {MobileNav} from './mobile-nav'
import {TopBarTitle} from './topbar-title'
type Tab='inicio'|'explorar'|'cadastrar'|'colecoes'|'perfil'
export function Screen({title,accent,subtitle,active,children,variant='light',backHref='/',compact=false}:{title:string;accent?:string;subtitle?:string;backHref?:string;compact?:boolean;active:Tab;children:React.ReactNode;variant?:'light'|'dark'}){
 const detail=compact||active==='cadastrar'||(backHref!=='/'&&backHref!=='/acervo')
 const heading=(title+' '+(accent||'')).replace(/\s+/g,' ').trim().replace(/[.]$/,'')
 const fallback:Record<Tab,string>={inicio:'Início',colecoes:'Acervo',cadastrar:'Novo item',explorar:'Explorar',perfil:'Perfil'}
 const label=active==='cadastrar'?'Novo item':!detail?fallback[active]:(heading||'Item')
 return <main className={'app-frame screen-'+variant}>
  <header className="topbar app-topbar">
   {detail?<Link href={backHref} className="back" aria-label="Voltar"><ArrowLeft size={22}/></Link>:null}
   <h1 className="app-topbar-heading">{active==='inicio'?<BrandLogo/>:<TopBarTitle fallback={label}/>}</h1>
  </header>
  <div className={'screen-body'+(compact?' screen-body-compact':'')}>{children}</div>
  {active!=='cadastrar'&&<MobileNav active={active}/>}
 </main>
}
