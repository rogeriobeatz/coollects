'use client'
import Link from 'next/link'
import {useState} from 'react'
import {House,Compass,Plus,Layers3,UserRound,X,Camera,ImagePlus,FolderPlus} from 'lucide-react'
type Tab='inicio'|'explorar'|'cadastrar'|'colecoes'|'perfil'
const tabs=[{id:'inicio',label:'Início',url:'/',Icon:House},{id:'colecoes',label:'Acervo',url:'/acervo',Icon:Layers3},{id:'explorar',label:'Explorar',url:'/explorar',Icon:Compass},{id:'perfil',label:'Perfil',url:'/perfil',Icon:UserRound}] as const
export function MobileNav({active}:{active:Tab}){
 const [open,setOpen]=useState(false)
 return <>
  <nav className="bottom-nav" aria-label="Navegação principal">
   {tabs.slice(0,2).map(({id,label,url,Icon})=><Link href={url} key={id} className={'nav-link '+(active===id?'selected':'')} aria-current={active===id?'page':undefined}><span className="nav-icon"><Icon size={21}/></span><span className="nav-label">{label}</span></Link>)}
   <button type="button" onClick={()=>setOpen(true)} className="nav-link nav-create" aria-label="Adicionar" aria-haspopup="dialog"><span className="nav-icon"><Plus size={27}/></span><span className="nav-label">Adicionar</span></button>
   {tabs.slice(2).map(({id,label,url,Icon})=><Link href={url} key={id} className={'nav-link '+(active===id?'selected':'')} aria-current={active===id?'page':undefined}><span className="nav-icon"><Icon size={21}/></span><span className="nav-label">{label}</span></Link>)}
  </nav>
  {open&&<div className="creation-sheet-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="creation-sheet" role="dialog" aria-modal="true" aria-label="Adicionar ao Coollects">
    <div className="creation-sheet-head"><h2>O que deseja adicionar?</h2><button type="button" aria-label="Fechar" onClick={()=>setOpen(false)}><X size={22}/></button></div>
    <Link href="/cadastrar?origem=camera" onClick={()=>setOpen(false)}><Camera size={23}/> Novo item <span>Fotografar ou escolher imagem</span></Link>
    <Link href="/cadastrar?origem=galeria" onClick={()=>setOpen(false)}><ImagePlus size={23}/> Importar da galeria <span>Usar uma foto existente</span></Link>
    <Link href="/colecoes?criar=1" onClick={()=>setOpen(false)}><FolderPlus size={23}/> Nova coleção <span>Organizar seus itens</span></Link>
   </section>
  </div>}
 </>
}
