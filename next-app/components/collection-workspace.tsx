'use client'
import { useCallback,useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import {useRouter,useSearchParams} from 'next/navigation'
import { ArrowRight,Check,ChevronLeft,Copy,Edit3,Eye,EyeOff,FolderPlus,Plus,Trash2,Layers3 } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { CategoryArt } from './category-art'
import {CollectionCard} from './collection-card'
import {MoreHorizontal} from 'lucide-react'
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
 const [openMenu,setOpenMenu]=useState<string|null>(null)
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
  const back=params.get('voltar')
  const itemId=!editId&&back&&/^item\/[0-9a-f-]{36}$/i.test(back)?back.slice(5):null
  const response=editId
   ?await db.from('collections').update(values).eq('id',editId).eq('owner_id',userId).select('id').single()
   :await db.from('collections').insert({...values,owner_id:userId}).select('id').single()
  if(response.error||!response.data){setSaving(false);setMessage('Não foi possível salvar a coleção. Verifique os dados e tente novamente.');return}
  if(itemId){
   const {error:linkError}=await db.from('collection_items').insert({collection_id:response.data.id,item_id:itemId})
   if(linkError){setSaving(false);setMessage('Coleção criada, mas não foi possível adicionar o item. Abra a coleção e tente novamente.');void refresh();return}
  }
  setSaving(false)
  reset();setFilter('Todas');setMessage('Coleção salva e sincronizada!');void refresh()
  if(itemId)router.push('/item/'+encodeURIComponent(itemId))
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
 return <section className="collection-workspace">
  <div className="workspace-toolbar"><strong>{busy?'Carregando…':collections.length+' '+(collections.length===1?'coleção':'coleções')}</strong><button type="button" className="ux-small-action" onClick={()=>start()}><Plus size={20}/> Nova coleção</button></div>
  {message&&<p role="status" className="status-inline">{message}</p>}
  {editing?<div className="collection-wizard">
   <div className="wizard-top"><span>{editId?'EDITAR':'CRIAR'} COLEÇÃO</span><span>0{step+1} / 04</span></div><div className="wizard-meter"><span style={{width:(step+1)*25+'%'}}/></div>
   <h2>{['Escolha a categoria','Qual o nome da coleção?','Uma cor para chamar de sua.','Qual é a história?'][step]}</h2>
   {step===0&&<div className="wizard-categories">{CATEGORIES.map(c=><button type="button" className={'wizard-category '+(category===c.name?'picked':'')} onClick={()=>setCategory(c.name)} key={c.name}><span>{c.name}</span>{c.name}{category===c.name&&<Check size={14}/>}</button>)}</div>}
   {step===1&&<label className="field-label">Nome da coleção<input autoFocus maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Meus carrinhos favoritos"/></label>}
   {step===2&&<><div className="swatch-row">{colors.map(s=><button type="button" key={s} className={'swatch '+(color===s?'current':'')} style={{backgroundColor:s}} onClick={()=>setColor(s)} aria-label={'Escolher cor '+s}>{color===s&&<Check size={18}/>}</button>)}</div><label className="field-label custom-color">Ou escolha outra cor<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label></>}
   {step===3&&<><label className="field-label">Descrição (opcional)<textarea rows={4} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="public-switch"><input type="checkbox" checked={isPublic} onChange={e=>setPublic(e.target.checked)}/> {isPublic?'Pública':'Privada'} <small>{isPublic?'Outras pessoas podem encontrar esta coleção e ver seus itens.':'Somente você pode ver esta coleção e seus itens.'}</small></label>{editId&&coverOptions.length>0&&<label className="field-label">Capa da coleção<select value={coverItemId||''} onChange={e=>setCoverItemId(e.target.value||null)}><option value="">Automática — primeiro item com foto</option>{coverOptions.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select><small>Escolha um item da coleção para aparecer na capa.</small></label>}</>}
   <div className="wizard-preview"><span className="preview-kicker">PRÉVIA DO CARTÃO</span><span className="preview-card" style={{'--poster-accent':safeColor(color)} as CSSProperties}><CategoryArt category={category}/><strong>{name||'Minha coleção'}</strong></span></div>
   <div className="wizard-footer"><button className="text-btn" onClick={()=>step===0?reset():setStep(step-1)}><ChevronLeft size={17}/>{step===0?'Cancelar':'Voltar'}</button><button disabled={saving||(step===1&&!name.trim())} className="pill-btn" onClick={()=>step===3?void save():setStep(step+1)}>{saving?'Salvando...':step===3?'Salvar coleção':'Continuar'} <ArrowRight size={18}/></button></div>
  </div>:<>
   {filters.length>2&&<div className="collection-controls"><div className="chip-rail">{filters.map(f=><button type="button" className={'chip '+(filter===f?'chip-active':'')} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>}
   {visible.length?<div className="collection-grid">{visible.map(collection=><CollectionCard key={collection.id} collection={collection} count={counts[collection.id]||0} actions={<div className="cc-card-actions">
    <button type="button" className="cc-more-trigger" aria-label={'Ações da coleção '+collection.name} aria-expanded={openMenu===collection.id} onClick={()=>setOpenMenu(openMenu===collection.id?null:collection.id)}><MoreHorizontal size={21}/></button>
    {openMenu===collection.id&&<div className="cc-more-menu">
     <button type="button" onClick={()=>{setOpenMenu(null);start(collection)}}><Edit3 size={17}/> Editar</button>
     <button type="button" onClick={()=>{setOpenMenu(null);void toggle(collection)}}>{collection.is_public?<EyeOff size={17}/>:<Eye size={17}/>} {collection.is_public?'Tornar privada':'Tornar pública'}</button>
     {collection.is_public&&<button type="button" onClick={()=>{setOpenMenu(null);void share(collection)}}><Copy size={17}/> Copiar link</button>}
     <button type="button" onClick={()=>{setOpenMenu(null);setDeleting(collection)}}><Trash2 size={17}/> Excluir</button>
    </div>}
   </div>}/>)}</div>:<div className="empty-collection-panel"><Layers3 size={45}/><h2>{busy?'Carregando…':collections.length?'Nenhuma coleção nesta categoria.':'Crie sua primeira coleção'}</h2><button type="button" className="pill-btn" onClick={()=>start()}><FolderPlus size={18}/> Nova coleção</button></div>}
  </>}
  {deleting&&<div className="edit-overlay" role="presentation"><section className="edit-modal" role="dialog" aria-modal="true" aria-label="Confirmar exclusão da coleção"><h2>Excluir coleção?</h2><p>Excluir “{deleting.name}”? Essa ação não pode ser desfeita. Os itens continuarão no seu acervo.</p><div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={removing} onClick={()=>setDeleting(null)}>Cancelar</button><button type="button" className="account-delete-button" disabled={removing} onClick={()=>void remove(deleting)}>{removing?"Excluindo…":"Excluir coleção"}</button></div></section></div>}
 </section>
}
