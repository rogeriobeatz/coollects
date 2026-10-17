'use client'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {Check,Layers3,Plus,X} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import type {CollectionRow} from '@/lib/catalog'

export function ItemCollectionPicker({itemId,onClose,onChanged}:{itemId:string;onClose:()=>void;onChanged:()=>void}){
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [linked,setLinked]=useState<string[]>([])
 const [loading,setLoading]=useState(true)
 const [working,setWorking]=useState<string|null>(null)
 const [error,setError]=useState('')
 const load=useCallback(async()=>{
  const db=getBrowserClient()
  if(!db){setError('Não foi possível conectar. Tente novamente.');setLoading(false);return}
  setLoading(true);setError('')
  const {data:{user},error:authError}=await db.auth.getUser()
  if(authError||!user){setError('Entre na sua conta para organizar este item.');setLoading(false);return}
  const [cs,ls]=await Promise.all([
   db.from('collections').select('*').eq('owner_id',user.id).order('created_at',{ascending:false}),
   db.from('collection_items').select('collection_id').eq('item_id',itemId)
  ])
  if(cs.error||ls.error)setError('Não foi possível carregar suas coleções. Tente novamente.')
  else{setCollections((cs.data||[]) as CollectionRow[]);setLinked((ls.data||[]).map(x=>x.collection_id))}
  setLoading(false)
 },[itemId])
 useEffect(()=>{void load()},[load])
 async function toggle(collectionId:string){
  if(working)return
  const db=getBrowserClient();if(!db)return
  setWorking(collectionId);setError('')
  const present=linked.includes(collectionId)
  const response=present
   ?await db.from('collection_items').delete().eq('item_id',itemId).eq('collection_id',collectionId)
   :await db.from('collection_items').insert({item_id:itemId,collection_id:collectionId})
  if(response.error)setError('Não foi possível atualizar a coleção. Tente novamente.')
  else{setLinked(prev=>present?prev.filter(x=>x!==collectionId):[...prev,collectionId]);onChanged()}
  setWorking(null)
 }
 return <div className="edit-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!working)onClose()}}>
  <section className="edit-modal collection-picker" role="dialog" aria-modal="true" aria-label="Adicionar item a coleções">
   <button type="button" className="close-modal" aria-label="Fechar seletor de coleções" disabled={Boolean(working)} onClick={onClose}><X size={22}/></button>
   <h2>Organizar item</h2><p>Escolha em quais coleções este item deve aparecer.</p>
   {error&&<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>void load()}>Tentar novamente</button></p>}
   {loading?<p role="status">Carregando suas coleções…</p>:collections.length?
    <div className="picker-options">{collections.map(c=><button type="button" key={c.id} className="picker-option item-picker-option" disabled={Boolean(working)} aria-pressed={linked.includes(c.id)} onClick={()=>void toggle(c.id)}>
     <Layers3 size={19}/><span><strong>{c.name}</strong><small>{c.is_public?'Pública — visível na comunidade':'Privada — só você vê'}</small></span>
     {linked.includes(c.id)&&<Check size={20} aria-label="Adicionada"/>}
    </button>)}</div>
   :<p>Você ainda não criou uma coleção. Crie uma para organizar este item.</p>}
   <Link className="pill-btn" href={"/colecoes?criar=1&voltar=item/"+encodeURIComponent(itemId)}><Plus size={18}/> Nova coleção</Link>
   <button type="button" className="save-item-button" onClick={onClose}>Concluir</button>
  </section>
 </div>
}
