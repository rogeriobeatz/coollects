import Link from 'next/link'
import { Home, Compass, PlusCircle, Layers3 } from 'lucide-react'
type Tab = 'inicio'|'explorar'|'cadastrar'|'colecoes'
const tabs = [{id:'inicio',label:'Início',url:'/',Icon:Home},{id:'explorar',label:'Explorar',url:'/explorar',Icon:Compass},{id:'cadastrar',label:'Cadastrar',url:'/cadastrar',Icon:PlusCircle},{id:'colecoes',label:'Coleções',url:'/colecoes',Icon:Layers3}] as const
export function MobileNav({active}:{active:Tab}) {
 return <nav className="bottom-nav" aria-label="Navegação principal">{tabs.map(({id,label,url,Icon})=><Link aria-current={active===id?'page':undefined} className={active===id?'nav-link selected':'nav-link'} href={url} key={id}><Icon size={22} strokeWidth={active===id?2.6:1.8}/><span>{label}</span></Link>)}</nav>
}
