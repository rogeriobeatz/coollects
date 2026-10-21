'use client'
import {Modal} from './modal'
import { useCallback,useEffect,useRef,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,ImagePlus,Plus,Trash2,Edit3,Check,X,Search,MoreHorizontal,Layers3 } from 'lucide-react'
import { MAX_ITEM_PHOTOS } from '@/lib/photo-limits'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,CATALOG_CHANGED,ItemRow,CollectionRow } from '@/lib/catalog'
import { signedImages,uploadImage } from '@/lib/images'
import { preparePhoto } from '@/lib/photo-preparation'
import { CATEGORIES } from '@/lib/local-catalog'
import {ItemCollectionPicker} from './item-collection-picker'
import {CollectibleCard} from './collectible-card'
import {CollectionView} from './collection-view'
import {VehicleFields} from './vehicle-fields'
import {FeedbackNotice,type NoticeKind} from './feedback-notice'
import {EmptyIllustration} from './empty-illustration'
import {readAll,readChunks} from '@/lib/pagination'
import {useUnsavedChanges} from './use-unsaved-changes'
const EDIT_PRIMARY=[['manufacturer','Montadora'],['series','Série'],['seriesNumber','Número na série'],['collectionNumber','Numeração geral']] as const
const EDIT_EXTRA=[['year','Ano da cartela'],['scale','Escala'],['color','Cor'],['condition','Condição']] as const
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
 const [galleryKept,setGalleryKept]=useState<{path:string;url:string|null}[]>([])
 const [galleryNew,setGalleryNew]=useState<{file:File;url:string}[]>([])
 const [form,setForm]=useState({name:'',brand:'',category:'Miniaturas',notes:'',collectionIds:[] as string[],details:{} as Record<string,string|number|null>})
 const initialForm=useRef('')
 const editDirty=Boolean(editing&&(JSON.stringify(form)!==initialForm.current||editPhoto||removePhoto||galleryNew.length||galleryKept.length!==(items.find(i=>i.id===editing)?.gallery_paths?.length||0)))
 useUnsavedChanges(editDirty&&!savingEdit)
 function closeEditor(){if(!editDirty||confirm('Descartar as alterações que ainda não foram salvas?'))setEditing(null)}
 const [displayLimit,setDisplayLimit]=useState(48)
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  setLoadError('')
  try{
   const [source,cols]=await Promise.all([
    readAll<ItemRow>((from,to)=>db.from('items').select('*',{count:'exact'}).eq('owner_id',userId).order('created_at',{ascending:false}).order('id').range(from,to)),
    readAll<CollectionRow>((from,to)=>db.from('collections').select('*',{count:'exact'}).eq('owner_id',userId).order('id').range(from,to))
   ])
   const joined=await readChunks<{collection_id:string;item_id:string}>(cols.map(c=>c.id),ids=>readAll((from,to)=>db.from('collection_items').select('collection_id,item_id',{count:'exact'}).in('collection_id',ids).order('collection_id').order('item_id').range(from,to)))
   setItems(source.map(row=>({...row,url:null})));setCollections(cols);setLinks(joined)
  }catch{setLoadError('Não conseguimos carregar seus itens. Tente novamente.')}
  finally{setLoading(false)}
 },[userId,retryKey])
 useEffect(()=>{void refresh()},[refresh])
 useEffect(()=>{
  const changed=(event:Event)=>{if((event as CustomEvent<string>).detail===userId)void refresh()}
  window.addEventListener(CATALOG_CHANGED,changed)
  return()=>window.removeEventListener(CATALOG_CHANGED,changed)
 },[refresh,userId])
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
  initialForm.current=JSON.stringify({name:item.name,brand:item.brand,category:item.category,notes:item.notes,details:item.details||{},collectionIds:links.filter(x=>x.item_id===item.id).map(x=>x.collection_id)})
  setEditPhoto(null);setRemovePhoto(false);setEditing(item.id);setForm({name:item.name,brand:item.brand,category:item.category,notes:item.notes,details:item.details||{},collectionIds:links.filter(x=>x.item_id===item.id).map(x=>x.collection_id)});setMessage('')
  galleryNew.forEach(p=>URL.revokeObjectURL(p.url));setGalleryNew([])
  const paths=item.gallery_paths||[]
  setGalleryKept(paths.map(path=>({path,url:null})))
  const db=getBrowserClient()
  if(db&&paths.length)void signedImages(db,paths).then(urls=>setGalleryKept(v=>v.map(p=>({...p,url:urls.get(p.path)??p.url}))))
 }
 /** Extra photos: upload new ones, then store the final list. Old files go only after success. */
 async function saveGallery(db:NonNullable<ReturnType<typeof getBrowserClient>>,original:ItemRow|undefined){
  const before=original?.gallery_paths||[]
  const kept=galleryKept.map(p=>p.path)
  if(!galleryNew.length&&kept.length===before.length)return true
  const uploaded:string[]=[]
  try{
   for(const photo of galleryNew){const prepared=await preparePhoto(photo.file);uploaded.push(await uploadImage(db,userId,prepared.file))}
   const {error}=await db.from('items').update({gallery_paths:[...kept,...uploaded]}).eq('id',editing!).eq('owner_id',userId)
   if(error)throw error
   const removed=before.filter(path=>!kept.includes(path))
   if(removed.length)await db.storage.from(BUCKET).remove(removed).catch(()=>{/* Metadata is already committed. */})
   return true
  }catch{
   if(uploaded.length)await db.storage.from(BUCKET).remove(uploaded)
   return false
  }
 }
 async function save(){
  const db=getBrowserClient();if(!db||!editing||!form.name.trim()||savingEdit)return
  setSavingEdit(true);setMessage('')
  const original=items.find(i=>i.id===editing)
  let uploaded:string|null=null
  let photoPreparationFailed=false
  let committed=false
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
   committed=true
   // A retry must retain the primary photo that was already committed.
   setItems(rows=>rows.map(row=>row.id===editing?{...row,...form,photo_path:newPhotoPath}:row))
   setEditPhoto(null);setRemovePhoto(false)
   uploaded=null
   // Only after the transaction commits, remove the previous image.
   let cleanupWarning=false
   if(newPhotoPath!==original?.photo_path&&original?.photo_path){
    const {error:photoError}=await db.storage.from(BUCKET).remove([original.photo_path])
    cleanupWarning=Boolean(photoError)
   }
   const galleryOk=await saveGallery(db,original)
   if(!galleryOk){setMessage('A ficha foi salva, mas as fotos extras não. Suas fotos continuam selecionadas; tente salvar novamente.');void refresh();return}
   galleryNew.forEach(p=>URL.revokeObjectURL(p.url))
   setEditing(null);setEditPhoto(null);setRemovePhoto(false);setGalleryNew([])
   setMessage(cleanupWarning?'Item salvo. A fotografia anterior ainda precisa ser removida.':'Item atualizado!',cleanupWarning?'error':'success')
   void refresh()
  }catch(error){
   // A failed RPC leaves the original item and links unchanged.
   if(uploaded)await db.storage.from(BUCKET).remove([uploaded])
   setMessage(committed?'A ficha foi salva, mas não foi possível concluir as fotografias. Seus arquivos selecionados continuam aqui; tente novamente.':photoPreparationFailed&&error instanceof Error?error.message:'Não foi possível concluir a edição. Nenhuma alteração parcial foi salva.')
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
   const files=[item.photo_path,...(item.gallery_paths||[])].filter((path):path is string=>Boolean(path))
   if(files.length){const {error:photoError}=await db.storage.from(BUCKET).remove(files);cleanupWarning=Boolean(photoError)}
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
 const photoKey=visible.slice(0,displayLimit).map(item=>item.photo_path||'').join(',')
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  const paths=photoKey.split(',').filter(Boolean)
  void signedImages(db,paths).then(urls=>{if(active)setItems(rows=>rows.map(row=>row.photo_path&&urls.has(row.photo_path)?{...row,url:urls.get(row.photo_path)!}:row))})
  return()=>{active=false}
 },[photoKey])
 useEffect(()=>setDisplayLimit(48),[deferredSearch,categoryFilter,collectionFilter,sortBy])
 return <section className="item-library">{returnCollection&&<Link className="text-link" href={"/colecao/"+encodeURIComponent(returnCollection)}>← Voltar à coleção</Link>}
 <div className="items-summary"><div><strong>{loading||loadError?'—':items.length} {items.length===1?'item':'itens'}</strong></div><Link href="/cadastrar" className="pill-btn"><Plus size={18}/> Novo item</Link></div>
 <label className="collection-search"><Search size={18}/><input aria-label="Buscar no meu acervo" placeholder="Buscar item, marca ou detalhe…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button type="button" aria-label="Limpar busca" onClick={()=>setSearch('')}>Limpar</button>}</label>
 {!loading&&!loadError&&items.length>0&&<div className="items-filters">
  <div className="chip-rail" role="group" aria-label="Filtrar itens por categoria">{categories.map(category=><button type="button" key={category} className={'chip '+(categoryFilter===category?'chip-active':'')} aria-pressed={categoryFilter===category} onClick={()=>setCategoryFilter(category)}>{category}</button>)}</div>
  <div className="items-filter-row"><label className="field-label">Coleção<select value={collectionFilter} onChange={event=>setCollectionFilter(event.target.value)}><option value="all">Todas as coleções</option><option value="unassigned">Sem coleção</option>{collections.map(collection=><option value={collection.id} key={collection.id}>{collection.name}</option>)}</select></label><label className="field-label">Ordenar por<select value={sortBy} onChange={event=>setSortBy(event.target.value)}><option value="recent">Mais recentes</option><option value="old">Mais antigos</option><option value="name">Nome A–Z</option></select></label></div>
  <div className="items-result-count"><p role="status">{visible.length} de {items.length} {items.length===1?'item':'itens'}</p>{(search||categoryFilter!=='Todas'||collectionFilter!=='all')&&<button type="button" className="text-btn" onClick={clearFilters}>Limpar filtros</button>}</div>
 </div>}
 {message&&!editing&&<FeedbackNotice key={message} message={message} kind={messageKind}/>}
 {loadError&&<div role="alert" className="scan-notice">{loadError} <button type="button" onClick={()=>{setLoading(true);setRetryKey(value=>value+1)}}>Tentar novamente</button></div>}
 {loadError?null:loading?<p>Carregando seu acervo…</p>:items.length===0?<div className="empty-collection-panel"><EmptyIllustration kind="first-item"/><h2>O primeiro item é especial.</h2><p>Cadastre um objeto para começar seu catálogo digital.</p><Link href="/cadastrar" className="pill-btn">Cadastrar item</Link></div>:<div className="item-list-shell">{visible.length===0&&<div role="status" className="empty-collection-panel"><EmptyIllustration kind="search"/><p>Nenhum item corresponde aos filtros.</p><button type="button" className="pill-btn" onClick={clearFilters}>Limpar filtros</button></div>}<CollectionView storageKey="coollects-items-view" items={visible.slice(0,displayLimit)} getItem={item=>({item,photoUrl:item.url,href:"/item/"+encodeURIComponent(item.id)})} renderCard={(item:ViewItem)=><CollectibleCard key={item.id} item={item} photoUrl={item.url} href={"/item/"+encodeURIComponent(item.id)}
  actions={<div className="cc-card-actions">
   <button type="button" className="cc-more-trigger" aria-label={"Ações de "+item.name} aria-expanded={menuItem===item.id} onClick={()=>setMenuItem(menuItem===item.id?null:item.id)}><MoreHorizontal size={20}/></button>
   {menuItem===item.id&&<div className="cc-more-menu">
    <button type="button" onClick={()=>{edit(item);setMenuItem(null)}}><Edit3 size={16}/> Editar</button>
    <button type="button" onClick={()=>{setPickerItem(item.id);setMenuItem(null)}}><Layers3 size={16}/> Adicionar a coleção</button>
    <button type="button" onClick={()=>{setDeleteError('');setDeleteItem(item);setMenuItem(null)}}><Trash2 size={16}/> Excluir</button>
   </div>}
  </div>}
 />}/></div>}
 {!loading&&!loadError&&visible.length>displayLimit&&<button type="button" className="load-more" onClick={()=>setDisplayLimit(n=>n+48)}>Mostrar mais itens</button>}
 {pickerItem&&<ItemCollectionPicker itemId={pickerItem} onClose={()=>setPickerItem(null)} onChanged={()=>void refresh()}/>}
 {deleteItem&&<Modal label="Confirmar exclusão de item" onClose={()=>setDeleteItem(null)} busy={removing} returnFocus={'[data-item-id="'+deleteItem.id+'"] .cc-more-trigger'}><section className="edit-modal"><h2>Excluir item?</h2><p>Excluir “{deleteItem.name}”? Essa ação não pode ser desfeita.</p>{deleteError&&<p role="alert" className="scan-notice">{deleteError}</p>}<div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={removing} onClick={()=>setDeleteItem(null)}>Cancelar</button><button type="button" className="account-delete-button" disabled={removing} onClick={()=>void remove(deleteItem)}>{removing?"Excluindo…":"Excluir item"}</button></div></section></Modal>}
 {editing&&<Modal label="Editar item" onClose={closeEditor} busy={savingEdit} initialFocus="input" returnFocus={'[data-item-id="'+editing+'"] .cc-more-trigger'}><section className="edit-modal item-edit-modal">
  <button type="button" className="close-modal" disabled={savingEdit} onClick={closeEditor} aria-label="Fechar"><X size={22}/></button>
  <h2>Editar item</h2>
  {message&&messageKind==='error'&&<p role="alert" className="scan-notice">{message}</p>}
  <label className="field-label">Nome<input value={form.name} maxLength={90} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label>
  <div className="form-double">
   <label className="field-label">Marca<input value={form.brand} maxLength={70} onChange={e=>setForm(v=>({...v,brand:e.target.value}))}/></label>
   <label className="field-label">Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
  </div>
  {form.category==='Miniaturas'&&<section className="diecast-fields" aria-label="Detalhes da miniatura">
   <div className="diecast-field-grid">{EDIT_PRIMARY.map(([key,label])=><label className="field-label" key={key}>{label}<input value={String(form.details[key]??'')} onChange={e=>setForm(v=>({...v,details:{...v.details,[key]:e.target.value}}))}/></label>)}</div>
   <details className="diecast-more"><summary>Mais detalhes da cartela</summary><div className="diecast-field-grid">{EDIT_EXTRA.map(([key,label])=><label className="field-label" key={key}>{label}<input value={String(form.details[key]??'')} onChange={e=>setForm(v=>({...v,details:{...v.details,[key]:e.target.value}}))}/></label>)}</div></details>
   <VehicleFields values={form.details} onChange={(key,value)=>setForm(v=>({...v,details:{...v.details,[key]:value}}))}/>
  </section>}
  <fieldset className="edit-photos"><legend>Fotos</legend>
   <label className="field-label">Trocar foto principal<input type="file" accept="image/jpeg,image/png,image/webp,.heic,.heif" onChange={e=>{setEditPhoto(e.target.files?.[0]||null);setRemovePhoto(false)}}/></label>
   <label className="remove-photo-choice"><input type="checkbox" checked={removePhoto} onChange={e=>{setRemovePhoto(e.target.checked);if(e.target.checked)setEditPhoto(null)}}/> Remover foto principal</label>
   <p className="edit-photos-label">Fotos extras ({galleryKept.length+galleryNew.length}/{MAX_ITEM_PHOTOS-1})</p>
   <div className="photo-strip">
    {galleryKept.map(photo=><div key={photo.path} className="photo-thumb">{photo.url?<img src={photo.url} alt=""/>:null}<button type="button" className="photo-thumb-remove" aria-label="Remover foto extra" onClick={()=>setGalleryKept(v=>v.filter(p=>p.path!==photo.path))}><X size={14}/></button></div>)}
    {galleryNew.map((photo,i)=><div key={photo.url} className="photo-thumb"><img src={photo.url} alt=""/><button type="button" className="photo-thumb-remove" aria-label={'Remover nova foto '+(i+1)} onClick={()=>{URL.revokeObjectURL(photo.url);setGalleryNew(v=>v.filter(p=>p.url!==photo.url))}}><X size={14}/></button></div>)}
    {galleryKept.length+galleryNew.length<MAX_ITEM_PHOTOS-1&&<label className="photo-thumb photo-thumb-add"><ImagePlus size={20}/><span>Foto</span><input className="visually-hidden" type="file" multiple accept="image/jpeg,image/png,image/webp,.heic,.heif" aria-label="Adicionar fotos extras" onChange={e=>{const files=Array.from(e.target.files||[]).slice(0,MAX_ITEM_PHOTOS-1-galleryKept.length-galleryNew.length);e.target.value='';setGalleryNew(v=>[...v,...files.map(file=>({file,url:URL.createObjectURL(file)}))])}}/></label>}
   </div>
  </fieldset>
  <fieldset className="collection-selector"><legend>Coleções</legend><div className="collection-chips">{collections.map(c=><label key={c.id}><input type="checkbox" checked={form.collectionIds.includes(c.id)} onChange={e=>setForm(v=>({...v,collectionIds:e.target.checked?[...v.collectionIds,c.id]:v.collectionIds.filter(id=>id!==c.id)}))}/>{c.name}</label>)}</div></fieldset>
  <label className="field-label">Observações<textarea rows={3} maxLength={300} value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/></label>
  <button className="save-item-button" disabled={savingEdit||!form.name.trim()} onClick={()=>void save()}><Check size={18}/> {savingEdit?"Salvando…":"Salvar alterações"}</button>
 </section></Modal>}
 </section>
}
