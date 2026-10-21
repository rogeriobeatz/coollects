'use client'
import {Modal} from './modal'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {Check,Layers3,Plus,X} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import type {CollectionRow} from '@/lib/catalog'
import {readAll} from '@/lib/pagination'

export function ItemCollectionPicker({itemId,onClose,onChanged,sharing=false}:{itemId:string;onClose:()=>void;onChanged:()=>void;sharing?:boolean}){
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [linked,setLinked]=useState<string[]>([])
 const [loading,setLoading]=useState(true)
 const [working,setWorking]=useState<string|null>(null)
 const [error,setError]=useState('')
 const load=useCallback(async()=>{
  const db=getBrowserClient()
  if(!db){setError('Não foi possível conectar. Tente novamente.');setLoading(false);return}
  setLoading(true);setError('')
  try{
   const {data:{user},error:authError}=await db.auth.getUser()
   if(authError||!user){setError('Entre na sua conta para organizar este item.');return}
   const [cs,ls]=await Promise.all([
    readAll<CollectionRow>((from,to)=>db.from('collections').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).order('id').range(from,to)),
    readAll<{collection_id:string}>((from,to)=>db.from('collection_items').select('collection_id',{count:'exact'}).eq('item_id',itemId).order('collection_id').range(from,to))
   ])
   setCollections(cs);setLinked(ls.map(x=>x.collection_id))
  }catch{setError('Não foi possível carregar suas coleções. Verifique sua conexão e tente novamente.')}
  finally{setLoading(false)}
 },[itemId])
 useEffect(()=>{void load()},[load])
 async function toggle(collectionId:string){
  if(working)return
  const db=getBrowserClient()
  if(!db){setError('Não foi possível conectar. Tente novamente.');return}
  setWorking(collectionId);setError('')
  const present=linked.includes(collectionId)
  try{
   const response=present
    ?await db.from('collection_items').delete().eq('item_id',itemId).eq('collection_id',collectionId)
    :await db.from('collection_items').insert({item_id:itemId,collection_id:collectionId})
   if(response.error){setError('Não foi possível atualizar a coleção. Tente novamente.');return}
   setLinked(prev=>present?prev.filter(x=>x!==collectionId):[...prev,collectionId])
   onChanged()
  }catch{setError('Não foi possível atualizar a coleção. Verifique sua conexão e tente novamente.')}
  finally{setWorking(null)}
 }
 return <Modal label="Adicionar item a coleções" onClose={onClose} busy={Boolean(working)} returnFocus={'[data-item-id="'+itemId+'"] .cc-more-trigger'}>
  <section className="edit-modal collection-picker">
   <button type="button" className="close-modal" aria-label="Fechar seletor de coleções" disabled={Boolean(working)} onClick={onClose}><X size={22}/></button>
   <h2>{sharing?'Compartilhar item':'Organizar item'}</h2><p>{sharing?'Escolha uma coleção para publicar. Todos os itens dela ficarão públicos.':'Escolha em quais coleções este item deve aparecer.'}</p>
   {error&&<p role="alert" className="scan-notice">{error} <button type="button" onClick={()=>void load()}>Tentar novamente</button></p>}
   {loading?<p role="status">Carregando suas coleções…</p>:collections.length?
    <div className="picker-options">{collections.map(c=><button type="button" key={c.id} className="picker-option item-picker-option" disabled={Boolean(working)} aria-pressed={linked.includes(c.id)} onClick={()=>void toggle(c.id)}>
     <Layers3 size={19}/><span><strong>{c.name}</strong><small>{c.is_public?'Pública — visível na comunidade':'Privada — só você vê'}</small></span>
     {linked.includes(c.id)&&<Check size={20} aria-label="Adicionada"/>}
    </button>)}</div>
   :<p>Você ainda não criou uma coleção. Crie uma para organizar este item.</p>}
   {sharing&&collections.filter(c=>linked.includes(c.id)&&!c.is_public).map(c=><Link key={c.id} className="pill-btn" href={'/colecao/'+encodeURIComponent(c.id)+'?compartilharItem='+encodeURIComponent(itemId)}>Publicar “{c.name}” e compartilhar</Link>)}
   <Link className="pill-btn" href={"/colecoes?criar=1&voltar=item/"+encodeURIComponent(itemId)}><Plus size={18}/> Nova coleção</Link>
   <button type="button" className="save-item-button" disabled={Boolean(working)} onClick={onClose}>Concluir</button>
  </section>
 </Modal>
}
