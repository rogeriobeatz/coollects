'use client'
import { useEffect,useMemo,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, FolderPlus, Layers3, Plus, SlidersHorizontal, Trash2 } from 'lucide-react'
import { CategoryArt } from './category-art'
import { CATEGORIES,getCollections,getItems,LocalCollection,LocalItem,safeColor,saveCollections,UPDATE_EVENT } from '@/lib/local-catalog'
const colors=['#6125BF','#F15700','#FFD94C','#86DAD8','#E998FB','#A4BCFF']
export function CollectionWorkspace(){
 const [collections,setCollections]=useState<LocalCollection[]>([])
 const [items,setItems]=useState<LocalItem[]>([])
 const [loaded,setLoaded]=useState(false)
 const [editing,setEditing]=useState(false)
 const [step,setStep]=useState(0)
 const [category,setCategory]=useState('Miniaturas')
 const [name,setName]=useState('')
 const [color,setColor]=useState('#6125BF')
 const [description,setDescription]=useState('')
 const [filter,setFilter]=useState('Todas')
 const [message,setMessage]=useState('')
 useEffect(()=>{
  function sync(){setCollections(getCollections());setItems(getItems());setLoaded(true)}
  sync();window.addEventListener(UPDATE_EVENT,sync);window.addEventListener('storage',sync)
  return ()=>{window.removeEventListener(UPDATE_EVENT,sync);window.removeEventListener('storage',sync)}
 },[])
 const visible=useMemo(()=>filter==='Todas'?collections:collections.filter(c=>c.category===filter),[collections,filter])
 const filters=['Todas',...Array.from(new Set(collections.map(c=>c.category)))]
 function reset(){setEditing(false);setStep(0);setName('');setCategory('Miniaturas');setColor('#6125BF');setDescription('')}
 function create(){
  if(!name.trim())return
  const next=[{id:crypto.randomUUID(),name:name.trim(),category,color,description:description.trim(),createdAt:new Date().toISOString()},...collections]
  if(saveCollections(next)){reset();setFilter('Todas');setMessage('Coleção criada neste dispositivo!')}else setMessage('Não foi possível salvar. Verifique o armazenamento do navegador.')
 }
 function remove(c:LocalCollection){
  if(!window.confirm('Excluir a coleção "'+c.name+'"? Os itens locais serão mantidos, sem vínculo com ela.'))return
  if(saveCollections(collections.filter(x=>x.id!==c.id))){
   // Desvincular os itens sem apagá-los evita dados órfãos.
   const updated=items.map(item=>item.collectionId===c.id?{...item,collectionId:''}:item)
   // Importar no topo para atualizar os vínculos após excluir.
   saveLinkedItems(updated)
   setMessage('Coleção excluída deste dispositivo.')
  }else setMessage('Não foi possível excluir a coleção.')
 }
 function saveLinkedItems(next:LocalItem[]){ try {localStorage.setItem('coollects.items.prototype.v1',JSON.stringify(next));window.dispatchEvent(new Event(UPDATE_EVENT))}catch{setMessage('Coleção excluída, mas alguns vínculos locais podem precisar de revisão.')} }
 return <section className="collection-workspace">
  <div className="workspace-toolbar"><div><p className="kicker">SUA BIBLIOTECA LOCAL</p><strong>{loaded?collections.length:'—'} coleções <span aria-hidden="true">✳</span></strong></div><button className="round-add" onClick={()=>{reset();setEditing(true);setMessage('')}} aria-label="Criar coleção"><Plus size={24}/></button></div>
  <p className="local-banner"><span aria-hidden="true">●</span> Modo prévia: seus dados ficam salvos apenas neste navegador.</p>
  {message&&<p role="status" className="status-inline"><Check size={17}/>{message}</p>}
  {editing?<div className="collection-wizard">
   <div className="wizard-top"><span>CRIAR COLEÇÃO</span><span>0{step+1} / 04</span></div><div className="wizard-meter"><span style={{width:((step+1)*25)+'%'}}/></div>
   <h2>{['O que vamos colecionar?','Dê um nome a esse universo.','Uma cor para chamar de sua.','Qual é a história?'][step]}</h2>
   {step===0&&<div className="wizard-categories">{CATEGORIES.map(c=><button type="button" className={'wizard-category '+(category===c.name?'picked':'')} onClick={()=>setCategory(c.name)} key={c.name}><span>{c.emoji}</span>{c.name}{category===c.name&&<Check size={14}/>}</button>)}</div>}
   {step===1&&<label className="field-label">Nome da coleção<input autoFocus maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Meus carrinhos favoritos"/></label>}
   {step===2&&<><div className="swatch-row">{colors.map(s=><button type="button" key={s} className={'swatch '+(color===s?'current':'')} style={{backgroundColor:s}} onClick={()=>setColor(s)} aria-label={'Escolher cor '+s}>{color===s&&<Check size={18}/>}</button>)}</div><label className="field-label custom-color">Ou escolha outra cor<input aria-label="Selecionar outra cor" type="color" value={color} onChange={e=>setColor(e.target.value)}/></label></>}
   {step===3&&<label className="field-label">Descrição (opcional)<textarea rows={4} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Conte o que torna essa coleção especial..."/></label>}
   <div className="wizard-preview"><span className="preview-kicker">PRÉVIA DO CARTÃO</span><span className="preview-card" style={{'--poster-accent':safeColor(color)} as CSSProperties}><CategoryArt category={category}/><strong>{name||'Minha coleção'}</strong></span></div>
   <div className="wizard-footer"><button className="text-btn" onClick={()=>step===0?reset():setStep(step-1)}><ChevronLeft size={17}/>{step===0?'Cancelar':'Voltar'}</button><button className="pill-btn" disabled={step===1&&!name.trim()} onClick={()=>step===3?create():setStep(step+1)}>{step===3?'Criar coleção':'Continuar'} <ArrowRight size={18}/></button></div>
  </div>:<div className="collection-controls"><div className="filter-header"><SlidersHorizontal size={16}/> FILTRAR POR CATEGORIA</div><div className="chip-rail">{filters.map(f=><button className={'chip '+(filter===f?'chip-active':'')} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>}
  {!editing&&<>{loaded&&visible.length>0?<div className="collection-grid">{visible.map(c=><article key={c.id} className="collection-card" style={{'--poster-accent':safeColor(c.color)} as CSSProperties}><CategoryArt category={c.category}/><span className="collection-doodle" aria-hidden="true">✳</span><div className="collection-card-bottom"><small>{c.category.toUpperCase()}</small><h3>{c.name}</h3><p>{items.filter(i=>i.collectionId===c.id).length} itens</p></div><button onClick={()=>remove(c)} className="collection-remove" aria-label={'Excluir coleção '+c.name}><Trash2 size={18}/></button></article>)}</div>:<div className="empty-collection-panel"><div className="empty-graphic"><Layers3 size={43}/><span>✳</span></div><h2>{collections.length===0?'Seu universo começa aqui.':'Nenhuma coleção nessa categoria.'}</h2><p>{collections.length===0?'Comece criando uma coleção. Dê um nome, uma categoria e uma cor para ela.':'Selecione outra categoria para ver suas coleções.'}</p>{collections.length===0&&<button className="pill-btn" onClick={()=>setEditing(true)}><FolderPlus size={18}/> Criar minha coleção</button>}</div>}
  <Link href="/cadastrar" className="next-step-link"><span><Plus size={20}/></span><strong>Próximo passo: cadastrar itens</strong><ArrowRight size={19}/></Link></>}
 </section>
}
