'use client'
import { useCallback,useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import {useRouter,useSearchParams} from 'next/navigation'
import { ArrowRight,Check,ChevronLeft,Copy,Edit3,Eye,EyeOff,FolderPlus,Plus,Trash2,Layers3 } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { CategoryArt } from './category-art'
import { CollectionCover } from './collection-cover'
import { CATEGORIES } from '@/lib/local-catalog'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,safeColor,collectionUrlPath } from '@/lib/catalog'
const colors=['#6125BF','#F15700','#FFD94C','#86DAD8','#E998FB','#A4BCFF']
export function CollectionWorkspace(){return <AuthGate>{userId=><Workspace userId={userId}/>}</AuthGate>}
function Workspace({userId}:{userId:string}){
 const router=useRouter()
 const params=useSearchParams()
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [counts,setCounts]=useState<Record<string,number>>({})
 const [busy,setBusy]=useState(true)
 const [saving,setSaving]=useState(false)
 const [editing,setEditing]=useState(false)
 const [editId,setEditId]=useState<string|null>(null)
 const [step,setStep]=useState(0)
 const [category,setCategory]=useState('Miniaturas')
 const [name,setName]=useState('')
 const [color,setColor]=useState('#6125BF')
 const [description,setDescription]=useState('')
 const [isPublic,setPublic]=useState(false)
 const [coverItemId,setCoverItemId]=useState<string|null>(null)
 const [coverOptions,setCoverOptions]=useState<ItemRow[]>([])
 const [filter,setFilter]=useState('Todas')
 const [message,setMessage]=useState('')
 const [deleting,setDeleting]=useState<CollectionRow|null>(null)
 const [removing,setRemoving]=useState(false)
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  const [{data,error},{data:links}]=await Promise.all([
   db.from('collections').select('*').eq('owner_id',userId).order('created_at',{ascending:false}),
   db.from('collection_items').select('collection_id')
  ])
  if(error)setMessage('Não foi possível carregar suas coleções. Tente novamente.')
  setCollections((data||[]) as CollectionRow[])
  const next:Record<string,number>={};(links||[]).forEach(l=>{next[l.collection_id]=(next[l.collection_id]||0)+1});setCounts(next)
  setBusy(false)
 },[userId])
 useEffect(()=>{void refresh()},[refresh])
 useEffect(()=>{if(params.get('criar')==='1')start() // New-collection deep link from the item picker.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 function reset(){setEditing(false);setEditId(null);setStep(0);setCategory('Miniaturas');setName('');setColor('#6125BF');setDescription('');setPublic(false);setCoverItemId(null);setCoverOptions([])}
 function start(c?:CollectionRow){setMessage('');if(c){setEditId(c.id);setCategory(c.category);setName(c.name);setColor(c.color);setDescription(c.description);setPublic(c.is_public);setCoverItemId(c.cover_item_id||null);
   const db=getBrowserClient();if(db)void db.from('collection_items').select('item_id').eq('collection_id',c.id).then(async({data})=>{const ids=(data||[]).map(row=>row.item_id);if(!ids.length){setCoverOptions([]);return}const result=await db.from('items').select('*').in('id',ids);setCoverOptions((result.data||[]) as ItemRow[])})}else reset();setStep(0);setEditing(true)}
 async function save(){
  const db=getBrowserClient();if(!db||!name.trim())return
  setSaving(true);setMessage('')
  const values={name:name.trim(),category,color,description:description.trim(),is_public:isPublic,cover_item_id:editId?coverItemId:null}
  const response=editId?await db.from('collections').update(values).eq('id',editId).eq('owner_id',userId):await db.from('collections').insert({...values,owner_id:userId})
  setSaving(false)
  if(response.error){setMessage('Não foi possível salvar a coleção. Verifique os dados e tente novamente.');return}
  reset();setFilter('Todas');setMessage('Coleção salva e sincronizada!');void refresh()
  const back=params.get('voltar')
  if(back&&/^item\/[0-9a-f-]{36}$/i.test(back))router.push('/'+back)
 }
 async function remove(c:CollectionRow){
  if(removing)return
  setRemoving(true)
  const db=getBrowserClient();if(!db)return
  const {error}=await db.from('collections').delete().eq('id',c.id).eq('owner_id',userId)
  setMessage(error?'Não foi possível excluir a coleção. Tente novamente.':'Coleção excluída. Os itens foram preservados.')
  if(!error){setDeleting(null);void refresh()}
  setRemoving(false)
 }
 async function toggle(c:CollectionRow){
  const db=getBrowserClient();if(!db)return
  const {error}=await db.from('collections').update({is_public:!c.is_public}).eq('id',c.id).eq('owner_id',userId)
  setMessage(error?'Não conseguimos alterar a visibilidade agora. Tente novamente.':!c.is_public?'Coleção publicada. Você pode compartilhar o link!':'Coleção privada novamente.')
  if(!error)void refresh()
 }
 async function share(c:CollectionRow){
  const url=window.location.origin+collectionUrlPath(c.id)
  try{await navigator.clipboard.writeText(url);setMessage('Link copiado para compartilhar!')}
  catch{setMessage('Copie o link da sua coleção: '+url)}
 }
 const visible=collections.filter(c=>filter==='Todas'||c.category===filter)
 const filters=['Todas',...Array.from(new Set(collections.map(c=>c.category)))]
 return <section className="collection-workspace"><nav className="library-switch" aria-label="Navegar no acervo"><span aria-current="page">Coleções</span><Link href="/itens">Todos os itens <ArrowRight size={15}/></Link></nav>
  <div className="workspace-toolbar"><div><p className="kicker">SUA BIBLIOTECA</p><strong>{busy?'—':collections.length} coleções <span aria-hidden="true">✳</span></strong></div><button className="round-add" onClick={()=>start()} aria-label="Criar coleção"><Plus size={24}/></button></div>
  <p className="local-banner"><span>●</span> Conta conectada: suas coleções ficam sincronizadas. Apenas coleções públicas aparecem na busca.</p>
  {message&&<p role="status" className="status-inline">{message}</p>}
  {editing?<div className="collection-wizard">
   <div className="wizard-top"><span>{editId?'EDITAR':'CRIAR'} COLEÇÃO</span><span>0{step+1} / 04</span></div><div className="wizard-meter"><span style={{width:(step+1)*25+'%'}}/></div>
   <h2>{['O que vamos colecionar?','Dê um nome a esse universo.','Uma cor para chamar de sua.','Qual é a história?'][step]}</h2>
   {step===0&&<div className="wizard-categories">{CATEGORIES.map(c=><button type="button" className={'wizard-category '+(category===c.name?'picked':'')} onClick={()=>setCategory(c.name)} key={c.name}><span>{c.emoji}</span>{c.name}{category===c.name&&<Check size={14}/>}</button>)}</div>}
   {step===1&&<label className="field-label">Nome da coleção<input autoFocus maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Meus carrinhos favoritos"/></label>}
   {step===2&&<><div className="swatch-row">{colors.map(s=><button type="button" key={s} className={'swatch '+(color===s?'current':'')} style={{backgroundColor:s}} onClick={()=>setColor(s)} aria-label={'Escolher cor '+s}>{color===s&&<Check size={18}/>}</button>)}</div><label className="field-label custom-color">Ou escolha outra cor<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label></>}
   {step===3&&<><label className="field-label">Descrição (opcional)<textarea rows={4} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="public-switch"><input type="checkbox" checked={isPublic} onChange={e=>setPublic(e.target.checked)}/> {isPublic?'Pública':'Privada'} <small>{isPublic?'Outras pessoas podem encontrar esta coleção e ver seus itens.':'Somente você pode ver esta coleção e seus itens.'}</small></label>{editId&&coverOptions.length>0&&<label className="field-label">Capa da coleção<select value={coverItemId||''} onChange={e=>setCoverItemId(e.target.value||null)}><option value="">Automática — primeiro item com foto</option>{coverOptions.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select><small>Escolha um item da coleção para aparecer na capa.</small></label>}</>}
   <div className="wizard-preview"><span className="preview-kicker">PRÉVIA DO CARTÃO</span><span className="preview-card" style={{'--poster-accent':safeColor(color)} as CSSProperties}><CategoryArt category={category}/><strong>{name||'Minha coleção'}</strong></span></div>
   <div className="wizard-footer"><button className="text-btn" onClick={()=>step===0?reset():setStep(step-1)}><ChevronLeft size={17}/>{step===0?'Cancelar':'Voltar'}</button><button disabled={saving||(step===1&&!name.trim())} className="pill-btn" onClick={()=>step===3?void save():setStep(step+1)}>{saving?'Salvando...':step===3?'Salvar coleção':'Continuar'} <ArrowRight size={18}/></button></div>
  </div>:<><div className="collection-controls"><div className="filter-header">FILTRAR POR CATEGORIA</div><div className="chip-rail">{filters.map(f=><button className={'chip '+(filter===f?'chip-active':'')} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>
   {visible.length?<div className="collection-grid">{visible.map(c=><article key={c.id} className="collection-card" style={{'--poster-accent':safeColor(c.color)} as CSSProperties}><Link href={collectionUrlPath(c.id)} className="card-full-link"><CollectionCover id={c.id} category={c.category} selectedId={c.cover_item_id}/><div className="collection-card-bottom"><small>{c.category.toUpperCase()}</small><h3>{c.name}</h3><p>{counts[c.id]||0} itens · {c.is_public?'Pública':'Privada'}</p></div></Link><div className="card-tools"><button aria-label={'Editar '+c.name} onClick={()=>start(c)}><Edit3 size={16}/></button><button aria-label={c.is_public?'Tornar privada':'Tornar pública'} onClick={()=>void toggle(c)}>{c.is_public?<Eye size={16}/>:<EyeOff size={16}/>}</button>{c.is_public&&<button aria-label="Copiar link" onClick={()=>void share(c)}><Copy size={16}/></button>}<button aria-label={'Excluir '+c.name} onClick={()=>setDeleting(c)}><Trash2 size={16}/></button></div></article>)}</div>:<div className="empty-collection-panel"><div className="empty-graphic"><Layers3 size={43}/><span>✳</span></div><h2>{busy?'Carregando…':collections.length?'Nada nesta categoria.':'Seu universo começa aqui.'}</h2><p>Crie sua coleção e comece a guardar os seus itens.</p><button className="pill-btn" onClick={()=>start()}><FolderPlus size={18}/> Criar coleção</button></div>}
   <Link href="/itens" className="next-step-link"><span><Plus size={20}/></span><strong>Meus itens e fotos</strong><ArrowRight size={19}/></Link>
  </>}
  {deleting&&<div className="edit-overlay" role="presentation"><section className="edit-modal" role="dialog" aria-modal="true" aria-label="Confirmar exclusão da coleção"><h2>Excluir coleção?</h2><p>Excluir “{deleting.name}”? Essa ação não pode ser desfeita. Os itens continuarão no seu acervo.</p><div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={removing} onClick={()=>setDeleting(null)}>Cancelar</button><button type="button" className="account-delete-button" disabled={removing} onClick={()=>void remove(deleting)}>{removing?"Excluindo…":"Excluir coleção"}</button></div></section></div>}
 </section>
}
