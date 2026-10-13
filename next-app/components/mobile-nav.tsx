import Link from 'next/link'
import { House, Compass, Plus, Layers3, UserRound } from 'lucide-react'
type Tab = 'inicio'|'explorar'|'cadastrar'|'colecoes'
const tabs = [
 {id:'inicio',label:'Início',url:'/',Icon:House},
 {id:'colecoes',label:'Coleções',url:'/colecoes',Icon:Layers3},
 {id:'cadastrar',label:'Adicionar',url:'/cadastrar',Icon:Plus},
 {id:'explorar',label:'Explorar',url:'/explorar',Icon:Compass},
 {id:'perfil',label:'Perfil',url:'/perfil',Icon:UserRound},
] as const
export function MobileNav({active}:{active:Tab}){
 return <nav className="bottom-nav" aria-label="Navegação principal">{tabs.map(({id,label,url,Icon})=><Link href={url} key={id} className={'nav-link '+(active===id?'selected ':'')+(id==='cadastrar'?'nav-create':'')} aria-label={id==='cadastrar'?'Cadastrar item':label} aria-current={active===id?'page':undefined}><span className="nav-icon"><Icon size={id==='cadastrar'?28:21} strokeWidth={id===active?2.7:2}/></span><span className="nav-label">{label}</span></Link>)}</nav>
}
