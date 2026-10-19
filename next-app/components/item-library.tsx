'use client'
import {Modal} from './modal'
import { useCallback,useEffect,useRef,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,Plus,Trash2,Edit3,Check,X,Search,MoreHorizontal,Layers3 } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,ItemRow,CollectionRow } from '@/lib/catalog'
import { signedImage,uploadImage } from '@/lib/images'
import { preparePhoto } from '@/lib/photo-preparation'
import { CATEGORIES } from '@/lib/local-catalog'
import {ItemCollectionPicker} from './item-collection-picker'
import {CollectibleCard} from './collectible-card'
import {CollectionView} from './collection-view'
import {VehicleFields} from './vehicle-fields'
import {FeedbackNotice,type NoticeKind} from './feedback-notice'
export function ItemLibrary(){return <AuthGate>{userId=><Library userId={userId}/>}</AuthGate>}
type ViewItem=ItemRow&{url:string|null}
function Library({userId}:{userId:string}){
 const [search,setSearch]=useState('')
 const [deferredSearch,setDeferredSearch]=useState('')
 const [categoryFilter,setCategoryFilter]=useState('Todas')
 const [collectionFilter,setCollectionFilter]=useState('all')
 const [sortBy,setSortBy]=useState('recent')
 const [loadError,setLoadError]=useState('')
 const [retryKey,setRetryKey]=useState(0)
 useEffect(()=>{const timer=setTimeout(()=>setDeferredSearch(search.trim().toLocaleLowerCase('pt-BR')),250);return()=>clearTimeout(timer)},[search])
 const deepLinkHandled=useRef(false)
 const [returnCollection,setReturnCollection]=useState<string|null>(null)
 const [items,setItems]=useState<ViewItem[]>([])
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [links,setLinks]=useState<{collection_id:string;item_id:string}[]>([])
 const [loading,setLoading]=useState(true),[message,setMessageValue]=useState('')
 const [messageKind,setMessageKind]=useState<NoticeKind>('error')
 function setMessage(value:string,kind:NoticeKind='error'){setMessageValue(value);setMessageKind(kind)}
 const [editing,setEditing]=useState<string|null>(null)
 const [menuItem,setMenuItem]=useState<string|null>(null)
 const [pickerItem,setPickerItem]=useState<string|null>(null)
 const [deleteItem,setDeleteItem]=useState<ItemRow|null>(null)
 const [removing,setRemoving]=useState(false)
 const [deleteError,setDeleteError]=useState('')
 const [editPhoto,setEditPhoto]=useState<File|null>(null)
 const [removePhoto,setRemovePhoto]=useState(false)
 const [savingEdit,setSavingEdit]=useState(false)
 const [form,setForm]=useState({name:'',brand:'',category:'Miniaturas',notes:'',collectionIds:[] as string[],details:{} as Record<string,string|number|null>})
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  setLoadError('')
  try{
   const [rows,cols,joined]=await Promise.all([
    db.from('items').select('*').eq('owner_id',userId).order('created_at',{ascending:false}),
    db.from('collections').select('*').eq('owner_id',userId),
    db.from('collection_items').select('collection_id,item_id')
   ])
   if(rows.error||cols.error||joined.error)throw new Error('Acervo indisponível')
   const source=(rows.data||[]) as ItemRow[]
   const urls=await Promise.all(source.map(async row=>({...row,url:await signedImage(db,row.photo_path)})))
   setItems(urls);setCollections((cols.data||[]) as CollectionRow[]);setLinks((joined.data||[]) as typeof links)
  }catch{setLoadError('Não conseguimos carregar seus itens. Tente novamente.')}
  finally{setLoading(false)}
 },[userId,retryKey])
 useEffect(()=>{void refresh()},[refresh])
 useEffect(()=>{
  if(loading||deepLinkHandled.current||!items.length)return
  deepLinkHandled.current=true
  const params=new URLSearchParams(window.location.search)
  const requested=params.get('editar')
  const item=items.find(i=>i.id===requested)
  const requestedDelete=params.get('excluir')
  const deleting=items.find(i=>i.id===requestedDelete)
  const returnId=params.get('voltar')
  if(returnId&&/^[0-9a-f-]{36}$/i.test(returnId))setReturnCollection(returnId)
  if(item)edit(item)
  else if(deleting)setDeleteItem(deleting)
 // Deep-linked editor should run once after the initial list is loaded.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[loading,items])
 function edit(item:ItemRow){
  setEditPhoto(null);setRemovePhoto(false);setEditing(item.id);setForm({name:item.name,brand:item.brand,category:item.category,notes:item.notes,details:item.details||{},collectionIds:links.filter(x=>x.item_id===item.id).map(x=>x.collection_id)});setMessage('')
 }
 async function save(){
  const db=getBrowserClient();if(!db||!editing||!form.name.trim())return
  setSavingEdit(true);setMessage('')
  const original=items.find(i=>i.id===editing)
  let uploaded:string|null=null
  let photoPreparationFailed=false
  try{
   if(editPhoto){
    let prepared:Awaited<ReturnType<typeof preparePhoto>>
    try{prepared=await preparePhoto(editPhoto)}catch(error){photoPreparationFailed=true;throw error}
    uploaded=await uploadImage(db,userId,prepared.file)
   }
   const newPhotoPath=uploaded||(removePhoto?null:original?.photo_path||null)
   const {error}=await db.rpc('update_item_with_details',{
    p_item_id:editing,p_name:form.name.trim(),p_brand:form.brand.trim(),
    p_category:form.category,p_notes:form.notes.trim(),p_photo_path:newPhotoPath,
    p_collection_ids:form.collectionIds,p_details:form.category==='Miniaturas'?form.details:{}
   })
   if(error)throw error
   // Only after the transaction commits, remove the previous image.
   let cleanupWarning=false
   if((uploaded||removePhoto)&&original?.photo_path){
    const {error:photoError}=await db.storage.from(BUCKET).remove([original.photo_path])
    cleanupWarning=Boolean(photoError)
   }
   setEditing(null);setEditPhoto(null);setRemovePhoto(false)
   setMessage(cleanupWarning?'Item salvo. A fotografia anterior ainda precisa ser removida.':'Item atualizado!',cleanupWarning?'error':'success')
   void refresh()
  }catch{
   // A failed RPC leaves the original item and links unchanged.
   if(uploaded)await db.storage.from(BUCKET).remove([uploaded])
   setMessage(photoPreparationFailed&&error instanceof Error?error.message:'Não foi possível concluir a edição. Nenhuma alteração parcial foi salva.')
  }finally{setSavingEdit(false)}
 }
 async function remove(item:ItemRow){
  if(removing)return
  const db=getBrowserClient();if(!db)return
  setRemoving(true)
  setDeleteError('')
  try{
   const {data,error}=await db.from('items').delete().eq('id',item.id).eq('owner_id',userId).select('id')
   if(error||data?.length!==1)throw new Error('Item não excluído')
   let cleanupWarning=false
   if(item.photo_path){const {error:photoError}=await db.storage.from(BUCKET).remove([item.photo_path]);cleanupWarning=Boolean(photoError)}
   setMessage(cleanupWarning?'Item excluído, mas a fotografia não pôde ser removida do armazenamento.':'Item excluído do acervo.',cleanupWarning?'error':'success')
   setDeleteItem(null);setMenuItem(null);void refresh()
  }catch{setDeleteError('Não foi possível excluir o item. Tente novamente.')}
  finally{setRemoving(false)}
 }
 function clearFilters(){setSearch('');setDeferredSearch('');setCategoryFilter('Todas');setCollectionFilter('all')}
 const categories=['Todas',...new Set(items.map(item=>item.category))]
 const visible=items.filter(item=>{
  if(categoryFilter!=='Todas'&&item.category!==categoryFilter)return false
  if(collectionFilter==='unassigned'&&links.some(link=>link.item_id===item.id))return false
  if(collectionFilter!=='all'&&collectionFilter!=='unassigned'&&!links.some(link=>link.item_id===item.id&&link.collection_id===collectionFilter))return false
  return [item.name,item.brand,item.category,item.notes,...Object.values(item.details||{}).map(String)].join(' ').toLocaleLowerCase('pt-BR').includes(deferredSearch)
 }).sort((a,b)=>sortBy==='name'?a.name.localeCompare(b.name,'pt-BR',{numeric:true}):sortBy==='old'?a.created_at.localeCompare(b.created_at):b.created_at.localeCompare(a.created_at))
 return <section className="item-library">{returnCollection&&<Link className="text-link" href={"/colecao/"+encodeURIComponent(returnCollection)}>← Voltar à coleção</Link>}
 <div className="items-summary"><div><strong>{loading||loadError?'—':items.length} {items.length===1?'item':'itens'}</strong></div><Link href="/cadastrar" className="pill-btn"><Plus size={18}/> Novo item</Link></div>
 <label className="collection-search"><Search size={18}/><input aria-label="Buscar no meu acervo" placeholder="Buscar item, marca ou detalhe…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button type="button" aria-label="Limpar busca" onClick={()=>setSearch('')}>Limpar</button>}</label>
 {!loading&&!loadError&&items.length>0&&<div className="items-filters">
  <div className="chip-rail" role="group" aria-label="Filtrar itens por categoria">{categories.map(category=><button type="button" key={category} className={'chip '+(categoryFilter===category?'chip-active':'')} aria-pressed={categoryFilter===category} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div>
  <div className="items-filter-row"><label className="field-label">Coleção<select value={collectionFilter} onChange={event=>setCollectionFilter(event.target.value)}><option value="all">Todas as coleções</option><option value="unassigned">Sem coleção</option>{collections.map(collection=><option value={collection.id} key={collection.id}>{collection.name}</option>)}</select></label><label className="field-label">Ordenar por<select value={sortBy} onChange={event=>setSortBy(event.target.value)}><option value="recent">Mais recentes</option><option value="old">Mais antigos</option><option value="name">Nome A–Z</option></select></label></div>
  <div className="items-result-count"><p role="status">{visible.length} de {items.length} {items.length===1?'item':'itens'}</p>{(search||categoryFilter!=='Todas'||collectionFilter!=='all')&&<button type="button" className="text-btn" onClick={clearFilters}>Limpar filtros</button>}</div>
 </div>}
 {message&&<FeedbackNotice key={message} message={message} kind={messageKind}/>}
 {loadError&&<div role="alert" className="scan-notice">{loadError} <button type="button" onClick={()=>{setLoading(true);setRetryKey(value=>value+1)}}>Tentar novamente</button></div>}
 {loadError?null:loading?<p>Carregando seu acervo…</p>:items.length===0?<div className="empty-collection-panel"><ImageIcon size={47}/><h2>O primeiro item é especial.</h2><p>Cadastre um objeto para começar seu catálogo digital.</p><Link href="/cadastrar" className="pill-btn">Cadastrar item</Link></div>:<div className="item-list-shell">{visible.length===0&&<div role="status" className="empty-collection-panel"><p>Nenhum item corresponde aos filtros.</p><button type="button" className="pill-btn" onClick={clearFilters}>Limpar filtros</button></div>}<CollectionView storageKey="coollects-items-view" items={visible} getItem={item=>({item,photoUrl:item.url,href:"/item/"+encodeURIComponent(item.id)})} renderCard={(item:ViewItem)=><CollectibleCard key={item.id} item={item} photoUrl={item.url} href={"/item/"+encodeURIComponent(item.id)}
  actions={<div className="cc-card-actions">
   <button type="button" className="cc-more-trigger" aria-label={"Ações de "+item.name} aria-expanded={menuItem===item.id} onClick={()=>setMenuItem(menuItem===item.id?null:item.id)}><MoreHorizontal size={20}/></button>
   {menuItem===item.id&&<div className="cc-more-menu">
    <button type="button" onClick={()=>{edit(item);setMenuItem(null)}}><Edit3 size={16}/> Editar</button>
    <button type="button" onClick={()=>{setPickerItem(item.id);setMenuItem(null)}}><Layers3 size={16}/> Adicionar a coleção</button>
    <button type="button" onClick={()=>{setDeleteError('');setDeleteItem(item);setMenuItem(null)}}><Trash2 size={16}/> Excluir</button>
   </div>}
  </div>}
 />}/></div>}
 {pickerItem&&<ItemCollectionPicker itemId={pickerItem} onClose={()=>setPickerItem(null)} onChanged={()=>void refresh()}/>}
 {deleteItem&&<Modal label="Confirmar exclusão de item" onClose={()=>setDeleteItem(null)} busy={removing} returnFocus={'[data-item-id="'+deleteItem.id+'"] .cc-more-trigger'}><section className="edit-modal"><h2>Excluir item?</h2><p>Excluir “{deleteItem.name}”? Essa ação não pode ser desfeita.</p>{deleteError&&<p role="alert" className="scan-notice">{deleteError}</p>}<div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={removing} onClick={()=>setDeleteItem(null)}>Cancelar</button><button type="button" className="account-delete-button" disabled={removing} onClick={()=>void remove(deleteItem)}>{removing?"Excluindo…":"Excluir item"}</button></div></section></Modal>}
 {editing&&<Modal label="Editar item" onClose={()=>setEditing(null)} busy={savingEdit} initialFocus="input" returnFocus={'[data-item-id="'+editing+'"] .cc-more-trigger'}><section className="edit-modal"><button type="button" className="close-modal" disabled={savingEdit} onClick={()=>setEditing(null)} aria-label="Fechar"><X size={22}/></button><h2>Editar item</h2><label className="field-label">Nome<input value={form.name} maxLength={90} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label><label className="field-label">Marca<input value={form.brand} maxLength={70} onChange={e=>setForm(v=>({...v,brand:e.target.value}))}/></label><label className="field-label">Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label>{form.category==='Miniaturas'&&<section className="diecast-fields"><h3>Detalhes da miniatura</h3><div className="diecast-field-grid">{([
 ['manufacturer','Montadora'],['series','Série'],['seriesNumber','Número na série'],['collectionNumber','Numeração geral'],['year','Ano da cartela'],['scale','Escala'],['color','Cor'],['condition','Condição']
] as const).map(([key,label])=><label className="field-label" key={key}>{label}<input value={String(form.details[key]??'')} onChange={e=>setForm(v=>({...v,details:{...v.details,[key]:e.target.value}}))}/></label>)}</div><VehicleFields values={form.details} onChange={(key,value)=>setForm(v=>({...v,details:{...v.details,[key]:value}}))}/></section>}<label className="field-label">Observações<textarea rows={3} maxLength={300} value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/></label><label className="field-label">Substituir fotografia<input type="file" accept="image/jpeg,image/png,image/webp,.heic,.heif" onChange={e=>{setEditPhoto(e.target.files?.[0]||null);setRemovePhoto(false)}}/></label><label className="remove-photo-choice"><input type="checkbox" checked={removePhoto} onChange={e=>{setRemovePhoto(e.target.checked);if(e.target.checked)setEditPhoto(null)}}/> Remover foto atual</label><fieldset className="collection-selector"><legend>Coleções</legend>{collections.map(c=><label key={c.id}><input type="checkbox" checked={form.collectionIds.includes(c.id)} onChange={e=>setForm(v=>({...v,collectionIds:e.target.checked?[...v.collectionIds,c.id]:v.collectionIds.filter(id=>id!==c.id)}))}/>{c.name}</label>)}</fieldset><button className="save-item-button" disabled={savingEdit||!form.name.trim()} onClick={()=>void save()}><Check size={18}/> {savingEdit?"Salvando…":"Salvar alterações"}</button></section></Modal>}
 </section>
}
