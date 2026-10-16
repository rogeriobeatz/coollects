'use client'
import { useCallback,useEffect,useRef,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,Plus,Trash2,Edit3,Check,X,Search } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,ItemRow,CollectionRow } from '@/lib/catalog'
import { signedImage,uploadImage } from '@/lib/images'
import { CATEGORIES } from '@/lib/local-catalog'
export function ItemLibrary(){return <AuthGate>{userId=><Library userId={userId}/>}</AuthGate>}
type ViewItem=ItemRow&{url:string|null}
function Library({userId}:{userId:string}){
 const [search,setSearch]=useState('')
 const deepLinkHandled=useRef(false)
 const [returnCollection,setReturnCollection]=useState<string|null>(null)
 const [items,setItems]=useState<ViewItem[]>([])
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [links,setLinks]=useState<{collection_id:string;item_id:string}[]>([])
 const [loading,setLoading]=useState(true),[message,setMessage]=useState('')
 const [editing,setEditing]=useState<string|null>(null)
 const [editPhoto,setEditPhoto]=useState<File|null>(null)
 const [removePhoto,setRemovePhoto]=useState(false)
 const [savingEdit,setSavingEdit]=useState(false)
 const [form,setForm]=useState({name:'',brand:'',category:'Miniaturas',notes:'',collectionIds:[] as string[],details:{} as Record<string,string|number|null>})
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  const [{data:rows,error},{data:cols},{data:joined}]=await Promise.all([
   db.from('items').select('*').eq('owner_id',userId).order('created_at',{ascending:false}),
   db.from('collections').select('*').eq('owner_id',userId),
   db.from('collection_items').select('collection_id,item_id')
  ])
  if(error)setMessage('Não conseguimos carregar seus itens. Tente novamente.')
  const source=(rows||[]) as ItemRow[]
  const urls=await Promise.all(source.map(async row=>({...row,url:await signedImage(db,row.photo_path)})))
  setItems(urls);setCollections((cols||[]) as CollectionRow[]);setLinks((joined||[]) as typeof links);setLoading(false)
 },[userId])
 useEffect(()=>{void refresh()},[refresh])
 useEffect(()=>{
  if(loading||deepLinkHandled.current||!items.length)return
  deepLinkHandled.current=true
  const params=new URLSearchParams(window.location.search)
  const requested=params.get('editar')
  const item=items.find(i=>i.id===requested)
  const returnId=params.get('voltar')
  if(returnId&&/^[0-9a-f-]{36}$/i.test(returnId))setReturnCollection(returnId)
  if(item)edit(item)
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
  try{
   if(editPhoto)uploaded=await uploadImage(db,userId,editPhoto)
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
   setMessage(cleanupWarning?'Item salvo. A fotografia anterior ainda precisa ser removida.':'Item atualizado!')
   void refresh()
  }catch{
   // A failed RPC leaves the original item and links unchanged.
   if(uploaded)await db.storage.from(BUCKET).remove([uploaded])
   setMessage('Não foi possível concluir a edição. Nenhuma alteração parcial foi salva.')
  }finally{setSavingEdit(false)}
 }
 async function remove(item:ItemRow){
  if(!confirm('Excluir permanentemente o item "'+item.name+'"?'))return
  const db=getBrowserClient();if(!db)return
  const {error}=await db.from('items').delete().eq('id',item.id).eq('owner_id',userId)
  if(error){setMessage('Não foi possível excluir o item. Tente novamente.');return}
  if(item.photo_path){const {error:photoError}=await db.storage.from(BUCKET).remove([item.photo_path]);if(photoError)setMessage('Item excluído, mas a fotografia não pôde ser removida do armazenamento.')}
  void refresh()
 }
 const visible=items.filter(i=>[i.name,i.brand,i.category,i.notes,...Object.values(i.details||{}).map(String)].join(" ").toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")))
 return <section className="item-library">{returnCollection&&<Link className="text-link" href={"/colecao/"+encodeURIComponent(returnCollection)}>← Voltar à coleção</Link>}<label className="collection-search"><Search size={18}/><input aria-label="Buscar no meu acervo" placeholder="Buscar item, marca ou categoria…" value={search} onChange={e=>setSearch(e.target.value)}/></label><Link href="/cadastrar" className="pill-btn"><Plus size={18}/> Cadastrar outro item</Link>{message&&<p role="status" className="scan-notice">{message}</p>}
 {loading?<p>Carregando seu acervo…</p>:items.length===0?<div className="empty-collection-panel"><ImageIcon size={47}/><h2>O primeiro item é especial.</h2><p>Cadastre um objeto para começar seu catálogo digital.</p><Link href="/cadastrar" className="pill-btn">Cadastrar item</Link></div>:<div className="item-list">{visible.length===0&&<p role="status">Nenhum item corresponde à busca.</p>}{visible.map(item=><article className="item-row" key={item.id}>
  {item.url?<img src={item.url} alt={item.name} className="item-photo"/>:<span className="item-no-photo"><ImageIcon size={28}/></span>}
  <div className="item-row-copy"><small>{item.category}</small><strong>{item.name}</strong><span>{item.brand||'Sem fabricante'} · {links.filter(l=>l.item_id===item.id).length} coleções</span>{item.category==='Miniaturas'&&item.details&&<span className="miniature-meta">{[item.details.manufacturer,item.details.series,item.details.seriesNumber,item.details.collectionNumber].filter(Boolean).join(' · ')}</span>}<div className="item-actions"><button onClick={()=>edit(item)}><Edit3 size={15}/> Editar</button><button onClick={()=>void remove(item)}><Trash2 size={15}/> Excluir</button></div></div>
 </article>)}</div>}
 {editing&&<div role="dialog" aria-modal="true" aria-label="Editar item" className="edit-overlay"><section className="edit-modal"><button className="close-modal" onClick={()=>setEditing(null)} aria-label="Fechar"><X size={22}/></button><h2>Editar item</h2><label className="field-label">Nome<input value={form.name} maxLength={90} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label><label className="field-label">Marca<input value={form.brand} maxLength={70} onChange={e=>setForm(v=>({...v,brand:e.target.value}))}/></label><label className="field-label">Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label>{form.category==='Miniaturas'&&<section className="diecast-fields"><h3>Detalhes da miniatura</h3><div className="diecast-field-grid">{([
 ['manufacturer','Montadora'],['series','Série'],['seriesNumber','Número na série'],['collectionNumber','Numeração geral'],['year','Ano da cartela'],['scale','Escala'],['color','Cor'],['condition','Condição']
] as const).map(([key,label])=><label className="field-label" key={key}>{label}<input value={String(form.details[key]??'')} onChange={e=>setForm(v=>({...v,details:{...v.details,[key]:e.target.value}}))}/></label>)}</div></section>}<label className="field-label">Observações<textarea rows={3} maxLength={300} value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/></label><label className="field-label">Substituir fotografia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{setEditPhoto(e.target.files?.[0]||null);setRemovePhoto(false)}}/></label><label className="remove-photo-choice"><input type="checkbox" checked={removePhoto} onChange={e=>{setRemovePhoto(e.target.checked);if(e.target.checked)setEditPhoto(null)}}/> Remover foto atual</label><fieldset className="collection-selector"><legend>Coleções</legend>{collections.map(c=><label key={c.id}><input type="checkbox" checked={form.collectionIds.includes(c.id)} onChange={e=>setForm(v=>({...v,collectionIds:e.target.checked?[...v.collectionIds,c.id]:v.collectionIds.filter(id=>id!==c.id)}))}/>{c.name}</label>)}</fieldset><button className="save-item-button" disabled={savingEdit} onClick={()=>void save()}><Check size={18}/> {savingEdit?"Salvando…":"Salvar alterações"}</button></section></div>}
 </section>
}
