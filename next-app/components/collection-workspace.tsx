'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FolderPlus, Layers3, Plus, Trash2 } from 'lucide-react'
export type Collection = { id:string; name:string; category:string; color:string; description:string; createdAt:string }
const KEY='coollects.collections.prototype.v1'
const categories=['Miniaturas','Cartas','Moedas','Action figures','Tênis','Jogos','Discos','Outros']
export function CollectionWorkspace(){
 const [collections,setCollections]=useState<Collection[]>([])
 const [hydrated,setHydrated]=useState(false)
 const [editing,setEditing]=useState(false)
 const [step,setStep]=useState(0)
 const [category,setCategory]=useState(categories[0])
 const [name,setName]=useState('')
 const [color,setColor]=useState('#6425bf')
 const [description,setDescription]=useState('')
 useEffect(()=>{try{const saved=localStorage.getItem(KEY);if(saved){const parsed:unknown=JSON.parse(saved);if(Array.isArray(parsed))setCollections(parsed.filter((c):c is Collection=>typeof c?.id==='string'&&typeof c?.name==='string'))}}catch{}setHydrated(true)},[])
 function persist(updated:Collection[]){setCollections(updated);try{localStorage.setItem(KEY,JSON.stringify(updated))}catch{}}
 function save(){if(!name.trim())return;persist([{id:crypto.randomUUID(),name:name.trim(),category,color,description:description.trim(),createdAt:new Date().toISOString()},...collections]);setEditing(false);setStep(0);setCategory(categories[0]);setName('');setDescription('')}
 return <section className="workspace"><div className="section-head"><h2>Minha biblioteca</h2><span>{hydrated?collections.length:'—'} coleções</span></div>
 <p className="prototype-warning">Prévia local: coleções salvas somente neste navegador. Ainda não há conta, sincronização ou compartilhamento público.</p>
 {!editing&&<button className="primary-btn button-reset" onClick={()=>setEditing(true)}><FolderPlus size={19}/> Criar coleção</button>}
 {editing&&<div className="wizard" aria-label="Criar coleção"><div className="wizard-progress">ETAPA {step+1} DE 4</div>
 {step===0&&<><h2>O que vamos colecionar?</h2><div className="category-grid">{categories.map(c=><button key={c} className={category===c?'category selected':'category'} onClick={()=>setCategory(c)}>{c}</button>)}</div></>}
 {step===1&&<><label htmlFor="collection-name">Dê um nome à sua coleção</label><input id="collection-name" maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Minha coleção de miniaturas"/></>}
 {step===2&&<><label htmlFor="collection-color">Escolha uma cor de identificação</label><input id="collection-color" type="color" value={color} onChange={e=>setColor(e.target.value)}/><p>A cor ajuda a reconhecer sua coleção rapidamente.</p></>}
 {step===3&&<><label htmlFor="collection-description">Conte um pouco sobre sua coleção</label><textarea id="collection-description" maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Minha paixão por..." rows={4}/></>}
 <div className="wizard-actions"><button type="button" className="secondary-btn" onClick={()=>step===0?setEditing(false):setStep(step-1)}>{step===0?'Cancelar':'Voltar'}</button><button type="button" className="primary-btn button-reset" disabled={step===1&&!name.trim()} onClick={()=>step===3?save():setStep(step+1)}>{step===3?'Salvar coleção':'Avançar'} <ArrowRight size={17}/></button></div>
 </div>}
 {!hydrated?<p>Carregando biblioteca…</p>:collections.length===0&&!editing?<div className="empty-state"><Layers3 size={42}/><h2>Sua biblioteca começa aqui</h2><p>Crie sua primeira coleção com categoria, cor e descrição.</p></div>:<div className="collection-list">{collections.map(c=><article key={c.id} className="collection-tile" style={{borderTopColor:c.color}}><div><span className="collection-category">{c.category}</span><h3>{c.name}</h3><p>{c.description||'Sem descrição'}</p><small>0 itens · Apenas neste dispositivo</small></div><button aria-label={`Excluir coleção ${c.name}`} className="delete-collection" onClick={()=>{if(window.confirm('Excluir esta coleção local?'))persist(collections.filter(x=>x.id!==c.id))}}><Trash2 size={18}/></button></article>)}</div>}
 <Link className="link-tip" href="/cadastrar"><Plus size={16}/> Próxima etapa: adicionar itens às coleções</Link>
 </section>
}
