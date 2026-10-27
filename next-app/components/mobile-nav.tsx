'use client'
import Link from 'next/link'
import {createPortal} from 'react-dom'
import {useEffect,useState} from 'react'
import { House, Plus, Layers3, Package, UserRound } from 'lucide-react'
export type NavigationTab = 'inicio'|'itens'|'cadastrar'|'colecoes'|'perfil'
const tabs = [
 {id:'inicio',label:'Home',url:'/',Icon:House},
 {id:'itens',label:'Itens',url:'/itens',Icon:Package},
 {id:'cadastrar',label:'Adicionar',url:'/cadastrar',Icon:Plus},
 {id:'colecoes',label:'Coleções',url:'/colecoes',Icon:Layers3},
 {id:'perfil',label:'Perfil',url:'/perfil',Icon:UserRound},
] as const
export function MobileNav({active}:{active?:NavigationTab}){
 const [mounted,setMounted]=useState(false)
 useEffect(()=>setMounted(true),[])
 if(!mounted)return null
 return createPortal(<nav className="bottom-nav" aria-label="Navegação principal">{tabs.map(({id,label,url,Icon})=><Link href={url} key={id} className={'nav-link '+(active===id?'selected ':'')+(id==='cadastrar'?'nav-create':'')} aria-label={label} aria-current={active===id?'page':undefined}><span className="nav-icon"><Icon size={id==='cadastrar'?28:21} strokeWidth={id===active?2.7:2}/></span>{id!=='cadastrar'&&<span className="nav-label">{label}</span>}</Link>)}</nav>,document.body)
}
