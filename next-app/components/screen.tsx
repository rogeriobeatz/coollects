import { AppHeader } from './app-header'
import { MobileNav,type NavigationTab } from './mobile-nav'
import { SocialToaster } from './social-interactions'

type ScreenArea=NavigationTab|'explorar'|'notificacoes'
const KICKERS:Record<ScreenArea,string>={
 inicio:'SEU PRÓXIMO TESOURO',explorar:'UM MUNDO DE DESCOBERTAS',colecoes:'DO SEU JEITO',itens:'SEU ACERVO',
 perfil:'VOCÊ NO COOLLECTS',cadastrar:'SEU PRÓXIMO TESOURO',notificacoes:'SUA COMUNIDADE'
}

export function Screen({title,accent,subtitle,active,children,variant='light',backHref='/',compact=false}:{title:string;accent?:string;subtitle:string;backHref?:string;compact?:boolean;active:ScreenArea;children:React.ReactNode;variant?:'light'|'dark'}) {
 const collectionLibrary=active==='colecoes'&&backHref==='/'
 const navTab=active==='explorar'||active==='notificacoes'?undefined:active
 return <main className={'app-frame screen-'+variant}>
 <AppHeader backHref={backHref} notificationsCurrent={active==='notificacoes'}/>
 {!compact&&<section className={'screen-intro'+(active==='itens'?' items-intro':'')+(collectionLibrary?' collections-intro':'')}><p className="kicker">{KICKERS[active]}</p><h1>{title}{accent&&<>{active==='itens'||collectionLibrary?' ':<br/>}<span>{accent}</span></>}</h1><p>{subtitle}</p><span className="intro-doodle" aria-hidden="true">✳</span></section>}
 <div className={'screen-body'+(compact?' screen-body-compact':'')}>{children}</div><SocialToaster/><MobileNav active={navTab}/></main>
}
