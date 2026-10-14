'use client'
import { useCallback,useEffect,useState } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,Plus,Trash2,Edit3,Check,X } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,ItemRow,CollectionRow } from '@/lib/catalog'
import { signedImage,uploadImage } from '@/lib/images'
import { CATEGORIES } from '@/lib/local-catalog'
export function ItemLibrary(){return <AuthGate>{userId=><Library userId={userId}/>}</AuthGate>}
type ViewItem=ItemRow&{url:string|null}
function Library({userId}:{userId:string}){
 const [items,setItems]=useState<ViewItem[]>([])
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [links,setLinks]=useState<{collection_id:string;item_id:string}[]>([])
 const [loading,setLoading]=useState(true),[message,setMessage]=useState('')
 const [editing,setEditing]=useState<string|null>(null)
 const [editPhoto,setEditPhoto]=useState<File|null>(null)
 const [removePhoto,setRemovePhoto]=useState(false)
 const [savingEdit,setSavingEdit]=useState(false)
 const [form,setForm]=useState({name:'',brand:'',category:'Miniaturas',notes:'',collectionIds:[] as string[]})
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
 function edit(item:ItemRow){
  setEditPhoto(null);setRemovePhoto(false);setEditing(item.id);setForm({name:item.name,brand:item.brand,category:item.category,notes:item.notes,collectionIds:links.filter(x=>x.item_id===item.id).map(x=>x.collection_id)});setMessage('')
 }
 async function save(){
  const db=getBrowserClient();if(!db||!editing||!form.name.trim())return
  setSavingEdit(true);setMessage('')
  const original=items.find(i=>i.id===editing)
  let uploaded:string|null=null
  try {
   if(editPhoto)uploaded=await uploadImage(db,userId,editPhoto)
   const values:{name:string;brand:string;category:string;notes:string;photo_path?:string|null}={
    name:form.name.trim(),brand:form.brand.trim(),category:form.category,notes:form.notes.trim()
   }
   if(uploaded)values.photo_path=uploaded
   else if(removePhoto)values.photo_path=null
   const {error}=await db.from('items').update(values).eq('id',editing).eq('owner_id',userId)
   if(error)throw error
   if((uploaded||removePhoto)&&original?.photo_path){
    const {error:photoError}=await db.storage.from(BUCKET).remove([original.photo_path])
    if(photoError)setMessage('Item atualizado; a foto antiga não pôde ser removida do armazenamento.')
   }
   const {error:unlinkError}=await db.from('collection_items').delete().eq('item_id',editing)
   if(unlinkError)throw new Error('Os dados foram salvos, mas os vínculos não puderam ser atualizados.')
   if(form.collectionIds.length){
    const {error:linkError}=await db.from('collection_items').insert(form.collectionIds.map(id=>({collection_id:id,item_id:editing})))
    if(linkError)throw new Error('Os dados foram salvos, mas não foi possível associar às coleções.')
   }
   setEditing(null);setEditPhoto(null);setRemovePhoto(false);setMessage('Item atualizado!');void refresh()
  }catch(e){
   if(uploaded && !items.some(i=>i.photo_path===uploaded)){
    // Apenas remover upload órfão se o item não tiver passado a usá-lo.
    const {data:current}=await db.from('items').select('photo_path').eq('id',editing).maybeSingle()
    if(current?.photo_path!==uploaded)await db.storage.from(BUCKET).remove([uploaded])
   }
   setMessage('Não foi possível concluir a edição. Confira os dados e tente novamente.')
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
 return <section className="item-library"><Link href="/cadastrar" className="pill-btn"><Plus size={18}/> Cadastrar outro item</Link>{message&&<p role="status" className="scan-notice">{message}</p>}
 {loading?<p>Carregando seu acervo…</p>:items.length===0?<div className="empty-collection-panel"><ImageIcon size={47}/><h2>O primeiro item é especial.</h2><p>Cadastre um objeto para começar seu catálogo digital.</p><Link href="/cadastrar" className="pill-btn">Cadastrar item</Link></div>:<div className="item-list">{items.map(item=><article className="item-row" key={item.id}>
  {item.url?<img src={item.url} alt={item.name} className="item-photo"/>:<span className="item-no-photo"><ImageIcon size={28}/></span>}
  <div className="item-row-copy"><small>{item.category}</small><strong>{item.name}</strong><span>{item.brand||'Sem fabricante'} · {links.filter(l=>l.item_id===item.id).length} coleções</span><div className="item-actions"><button onClick={()=>edit(item)}><Edit3 size={15}/> Editar</button><button onClick={()=>void remove(item)}><Trash2 size={15}/> Excluir</button></div></div>
 </article>)}</div>}
 {editing&&<div role="dialog" aria-modal="true" aria-label="Editar item" className="edit-overlay"><section className="edit-modal"><button className="close-modal" onClick={()=>setEditing(null)} aria-label="Fechar"><X size={22}/></button><h2>Editar item</h2><label className="field-label">Nome<input value={form.name} maxLength={90} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label><label className="field-label">Marca<input value={form.brand} maxLength={70} onChange={e=>setForm(v=>({...v,brand:e.target.value}))}/></label><label className="field-label">Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label><label className="field-label">Observações<textarea rows={3} maxLength={300} value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/></label><label className="field-label">Substituir fotografia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{setEditPhoto(e.target.files?.[0]||null);setRemovePhoto(false)}}/></label><label className="remove-photo-choice"><input type="checkbox" checked={removePhoto} onChange={e=>{setRemovePhoto(e.target.checked);if(e.target.checked)setEditPhoto(null)}}/> Remover foto atual</label><fieldset className="collection-selector"><legend>Coleções</legend>{collections.map(c=><label key={c.id}><input type="checkbox" checked={form.collectionIds.includes(c.id)} onChange={e=>setForm(v=>({...v,collectionIds:e.target.checked?[...v.collectionIds,c.id]:v.collectionIds.filter(id=>id!==c.id)}))}/>{c.name}</label>)}</fieldset><button className="save-item-button" disabled={savingEdit} onClick={()=>void save()}><Check size={18}/> {savingEdit?"Salvando…":"Salvar alterações"}</button></section></div>}
 </section>
}
