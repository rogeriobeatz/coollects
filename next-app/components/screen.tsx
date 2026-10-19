import { AppHeader } from './app-header'
import { MobileNav,type NavigationTab } from './mobile-nav'
export function Screen({title,accent,subtitle,active,children,variant='light',backHref='/',compact=false}:{title:string;accent?:string;subtitle:string;backHref?:string;compact?:boolean;active:NavigationTab|'perfil';children:React.ReactNode;variant?:'light'|'dark'}) {
 const collectionLibrary=active==='colecoes'&&backHref==='/'
 return <main className={'app-frame screen-'+variant}>
 <AppHeader backHref={backHref} profileCurrent={active==='perfil'}/>
 {!compact&&<section className={'screen-intro'+(active==='itens'?' items-intro':'')+(collectionLibrary?' collections-intro':'')}><p className="kicker">{active==='explorar'?'UM MUNDO DE DESCOBERTAS':active==='colecoes'?'DO SEU JEITO':active==='itens'?'SEU ACERVO':active==='perfil'?'VOCÊ NO COOLLECTS':'SEU PRÓXIMO TESOURO'}</p><h1>{title}{accent&&<>{active==='itens'||collectionLibrary?' ':<br/>}<span>{accent}</span></>}</h1><p>{subtitle}</p><span className="intro-doodle" aria-hidden="true">✳</span></section>}
 <div className={'screen-body'+(compact?' screen-body-compact':'')}>{children}</div><MobileNav active={active==='perfil'?undefined:active}/></main>
}
