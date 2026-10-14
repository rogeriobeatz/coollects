import Link from 'next/link'
import { House, Compass, Plus, Layers3, UserRound } from 'lucide-react'
type Tab = 'inicio'|'explorar'|'cadastrar'|'colecoes'|'perfil'
const tabs = [
 {id:'inicio',label:'Início',url:'/',Icon:House},
 {id:'colecoes',label:'Coleções',url:'/colecoes',Icon:Layers3},
 {id:'explorar',label:'Explorar',url:'/explorar',Icon:Compass},
 {id:'perfil',label:'Perfil',url:'/perfil',Icon:UserRound},
] as const
export function MobileNav({active}:{active:Tab}){
 return <><nav className="bottom-nav" aria-label="Navegação principal">{tabs.map(({id,label,url,Icon})=><Link href={url} key={id} className={'nav-link '+(active===id?'selected ':'')} aria-label={label} aria-current={active===id?'page':undefined}><span className="nav-icon"><Icon size={21} strokeWidth={id===active?2.7:2}/></span><span className="nav-label">{label}</span></Link>)}</nav><Link href="/cadastrar" className="floating-add" aria-label="Cadastrar novo item"><Plus size={27} strokeWidth={2.6}/></Link></>
}
