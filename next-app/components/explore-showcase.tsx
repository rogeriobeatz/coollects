'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass, Search, Sparkles, Users } from 'lucide-react'
import { CategoryArt } from './category-art'
const themes=[
 {category:'Miniaturas',title:'Pequenas máquinas. Grandes paixões.',tone:'orange',tag:'GARAGEM'},
 {category:'Cartas',title:'Cartas que contam histórias.',tone:'purple',tag:'RARIDADES'},
 {category:'Tênis',title:'Pares cheios de personalidade.',tone:'yellow',tag:'ESTILO'},
 {category:'Games',title:'A nostalgia também se coleciona.',tone:'blue',tag:'RETRO'},
 {category:'Quadrinhos',title:'Universos em cada página.',tone:'pink',tag:'CULTURA POP'},
 {category:'Discos',title:'Coleções que têm trilha sonora.',tone:'mint',tag:'MÚSICA'},
]
const filters=['Tudo','Miniaturas','Cartas','Tênis','Games','Quadrinhos','Discos']
export function ExploreShowcase(){
 const [filter,setFilter]=useState('Tudo')
 const [query,setQuery]=useState('')
 const visible=themes.filter(t=>(filter==='Tudo'||t.category===filter) && (t.title.toLowerCase().includes(query.toLowerCase())||t.category.toLowerCase().includes(query.toLowerCase())))
 return <section className="explore-showcase">
 <div className="explore-search"><Search size={22}/><input aria-label="Buscar temas de coleções" placeholder="O que você coleciona?" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="chip-rail explore-filters">{filters.map(f=><button className={'chip '+(filter===f?'chip-active':'')} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
 <div className="explore-spotlight"><span className="explore-rays" aria-hidden="true">✳</span><span className="kicker kicker-light">VEM AÍ · COMUNIDADE</span><h2>Mais que objetos.<br/>Conexões reais.</h2><p>Em breve você vai descobrir as coleções de gente que compartilha as mesmas paixões.</p><span className="spotlight-people"><Users size={21}/> Feito para colecionadores</span></div>
 <div className="section-title-inline"><div><p className="kicker">INSPIRAÇÃO PARA SEU ACERVO</p><h2>Universos<br/><em>para explorar.</em></h2></div><Compass size={28}/></div>
 <p className="demo-disclosure"><Sparkles size={15}/> Temas ilustrativos, não coleções ou perfis de usuários reais.</p>
 <div className="explore-grid">{visible.map((t,i)=><Link href="/colecoes" className={'explore-card '+(i===0?'explore-featured':'')} key={t.category}><CategoryArt category={t.category}/><div className="explore-card-copy"><small>{t.tag}</small><strong>{t.title}</strong><span>{t.category} <ArrowRight size={17}/></span></div></Link>)}</div>
 {visible.length===0&&<div className="explore-no-results">Nada por aqui ainda. Tente outro termo.</div>}
 <div className="explore-footer"><span className="explore-footer-icon"><Users size={25}/></span><div><strong>Sua coleção merece ser descoberta.</strong><p>Cadastre seus itens agora. Perfis e compartilhamento vêm na próxima fase.</p></div><Link href="/colecoes" aria-label="Criar coleção"><ArrowRight size={22}/></Link></div>
 </section>
}
