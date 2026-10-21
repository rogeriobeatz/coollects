'use client'
import {useState,type FormEvent} from 'react'
import {Modal} from './modal'
import {CollectionCard} from './collection-card'
import {getBrowserClient} from '@/lib/supabase/client'
import {CATEGORIES} from '@/lib/local-catalog'
import type {CollectionRow} from '@/lib/catalog'

/** Create without leaving the item draft. Customization stays in the collection editor. */
export function QuickCollection({userId,category,onCreated,onClose}:{userId:string;category:string;onCreated:(collection:CollectionRow)=>void;onClose:()=>void}){
 const [name,setName]=useState(''),[kind,setKind]=useState(category),[busy,setBusy]=useState(false),[error,setError]=useState('')
 async function save(event:FormEvent){
  event.preventDefault();if(busy||!name.trim())return
  const db=getBrowserClient();if(!db){setError('Não foi possível conectar. Tente novamente.');return}
  setBusy(true);setError('')
  try{
   const {data,error}=await db.from('collections').insert({owner_id:userId,name:name.trim(),category:kind,color:'#6125BF',description:'',is_public:false}).select('*').single()
   if(error||!data)throw error||new Error('missing collection')
   onCreated(data as CollectionRow)
  }catch{setError('Não foi possível criar a coleção. Seus dados do item continuam aqui. Tente novamente.')}
  finally{setBusy(false)}
 }
 return <Modal label="Nova coleção" busy={busy} onClose={onClose} initialFocus="input"><form className="edit-modal" onSubmit={event=>void save(event)}>
  <h2>Nova coleção</h2><p>Crie uma coleção privada sem sair do cadastro. Você pode personalizá-la depois.</p>
  <label className="field-label">Nome da coleção<input required maxLength={70} value={name} onChange={e=>setName(e.target.value)}/></label>
  <label className="field-label">Categoria da coleção<select value={kind} onChange={e=>setKind(e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
  <CollectionCard className="collection-preview" collection={{name:name||'Minha coleção',category:kind,color:'#6125BF'}}/>
  {error&&<p className="scan-notice" role="alert">{error}</p>}
  <div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="pill-btn" disabled={busy||!name.trim()}>{busy?'Criando…':'Criar coleção'}</button></div>
 </form></Modal>
}
