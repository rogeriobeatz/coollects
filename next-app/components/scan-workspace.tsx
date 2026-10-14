'use client'
import { useEffect,useRef,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { ArrowRight,Camera,Check,ChevronDown,ImagePlus,Layers3,ScanLine,Sparkles,X } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,CollectionRow } from '@/lib/catalog'
import { uploadImage } from '@/lib/images'
import { CATEGORIES } from '@/lib/local-catalog'
export function ScanWorkspace({aiEnabled=false}:{aiEnabled?:boolean}){return <AuthGate>{userId=><Editor userId={userId} aiEnabled={aiEnabled}/>}</AuthGate>}
function Editor({userId,aiEnabled}:{userId:string;aiEnabled:boolean}){
 const fileRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null)
 const [file,setFile]=useState<File|null>(null),[image,setImage]=useState('')
 const [name,setName]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState<string>('Miniaturas')
 const [collectionIds,setCollectionIds]=useState<string[]>([]),[notes,setNotes]=useState('')
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [saving,setSaving]=useState(false),[recognizing,setRecognizing]=useState(false)
 const [notice,setNotice]=useState(''),[saved,setSaved]=useState(false)
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  void db.from('collections').select('*').eq('owner_id',userId).order('created_at').then(({data})=>setCollections((data||[]) as CollectionRow[]))
 },[userId])
 useEffect(()=>{if(!file){setImage('');return};const url=URL.createObjectURL(file);setImage(url);return ()=>URL.revokeObjectURL(url)},[file])
 function pick(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value='';if(!f)return
  if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){setNotice('Use JPG, PNG ou WebP de até 5 MB.');return}
  setFile(f);setSaved(false);setNotice('Foto selecionada. Revise os dados antes de salvar.')
 }
 async function recognize(){
  if(!file)return setNotice('Tire uma foto ou escolha uma imagem primeiro.')
  if(file.size>4*1024*1024)return setNotice('Para IA, a imagem deve ter até 4 MB.')
  setRecognizing(true);setNotice('')
  try{
   const form=new FormData();form.append('image',file)
   const response=await fetch('/api/recognize',{method:'POST',body:form})
   const data=await response.json() as {error?:string;suggestion?:{name:string;brand:string;category:string;notes:string;visibleText:string;confidence:string}}
   if(!response.ok||!data.suggestion)throw new Error(data.error||'A leitura não foi concluída.')
   const s=data.suggestion
   if(s.name)setName(s.name);if(s.brand)setBrand(s.brand)
   if(CATEGORIES.some(c=>c.name===s.category))setCategory(s.category)
   if(s.notes||s.visibleText)setNotes([s.notes,s.visibleText?'Texto visível: '+s.visibleText:''].filter(Boolean).join(' | ').slice(0,300))
   setNotice('Sugestões adicionadas. Confira cada informação antes de salvar.')
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível reconhecer o item.')}
  finally{setRecognizing(false)}
 }
 async function save(){
  if(!name.trim()){setNotice('Dê um nome ao item.');document.getElementById('item-name')?.focus();return}
  const db=getBrowserClient();if(!db)return
  setSaving(true);setNotice('');setSaved(false)
  let photoPath:string|null=null
  try{
   if(file)photoPath=await uploadImage(db,userId,file)
   const {data:item,error}=await db.from('items').insert({owner_id:userId,name:name.trim(),brand:brand.trim(),category,notes:notes.trim(),photo_path:photoPath}).select('id').single()
   if(error||!item)throw error||new Error('Não foi possível salvar o item.')
   if(collectionIds.length){
    const {error:linkError}=await db.from('collection_items').insert(collectionIds.map(id=>({collection_id:id,item_id:item.id})))
    if(linkError){setNotice('Item salvo, mas não foi possível associá-lo às coleções. Você pode editar os vínculos em Meus itens.');setSaved(true);setSaving(false);return}
   }
   setSaved(true);setNotice('Item e fotografia salvos na sua conta!')
  }catch(e){
   if(photoPath){await db.storage.from(BUCKET).remove([photoPath])}
   setNotice('Não foi possível salvar o item agora. Verifique a fotografia e tente novamente.')
  }finally{setSaving(false)}
 }
 function reset(){setFile(null);setName('');setBrand('');setCategory('Miniaturas');setNotes('');setCollectionIds([]);setSaved(false);setNotice('')}
 return <section className="scan-workspace">
  <div className={'scanner-stage '+(image?'has-image':'')}>
   {image?<img className="scanner-photo" src={image} alt="Prévia da fotografia do item"/>:<div className="scanner-placeholder"><div className="scanner-symbol"><ScanLine size={58}/></div><strong>Aponte. Fotografe.<br/>Colecione.</strong><p>Seu acervo, um item de cada vez.</p></div>}
   <div className="scanner-corners" aria-hidden="true"><i/><i/><i/><i/></div><span className="scanner-pill"><span/> CÂMERA / GALERIA</span>
   {file&&<button type="button" className="photo-clear" aria-label="Remover imagem" onClick={()=>setFile(null)}><X size={20}/></button>}
  </div>
  <div className="capture-button-row"><button className="capture-secondary" onClick={()=>fileRef.current?.click()} aria-label="Selecionar fotografia"><ImagePlus size={26}/></button><button className="shutter-button" onClick={()=>cameraRef.current?.click()} aria-label="Abrir a câmera"><Camera size={34}/></button><button className="capture-secondary" onClick={()=>document.getElementById('item-name')?.focus()} aria-label="Preencher manualmente"><Layers3 size={25}/></button></div>
  <div className="scan-methods"><button onClick={()=>cameraRef.current?.click()}><Camera size={16}/> Tirar foto</button><button onClick={()=>fileRef.current?.click()}><ImagePlus size={16}/> Galeria</button></div>
  <input className="visually-hidden" aria-label="Capturar foto" ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={pick}/>
  <input className="visually-hidden" aria-label="Escolher foto" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}/>
  {aiEnabled&&<><div className="ai-ribbon"><Sparkles size={24}/><div><strong>Leitura inteligente</strong><p>OCR e IA sugerem os dados visíveis. Você decide o que salvar. Limite de 10 leituras por dia.</p></div></div>
  <button className="ai-button" type="button" disabled={!file||recognizing||saving} onClick={()=>void recognize()}><Sparkles size={18}/>{recognizing?'Analisando imagem…':'Reconhecer com IA'}</button></>}
  <div className="item-form"><div className="section-title-inline"><div><p className="kicker">REVISE ANTES DE SALVAR</p><h2>Ficha do<br/><em>seu item.</em></h2></div><span className="form-sticker" aria-hidden="true">✦</span></div>
   <label className="field-label" htmlFor="item-name">Nome do item *<input id="item-name" maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Porsche 911 GT3 RS"/></label>
   <div className="form-double"><label className="field-label" htmlFor="item-brand">Marca<input id="item-brand" maxLength={70} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Fabricante"/></label><label className="field-label" htmlFor="item-category">Categoria<span className="select-wrap"><select id="item-category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label></div>
   <fieldset className="collection-selector"><legend>Adicionar a coleções (opcional)</legend>{collections.length?collections.map(c=><label key={c.id}><input type="checkbox" checked={collectionIds.includes(c.id)} onChange={e=>setCollectionIds(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}</label>):<p>Você ainda não possui coleções. <Link href="/colecoes">Criar coleção</Link></p>}</fieldset>
   <label className="field-label" htmlFor="item-notes">Observações (podem ser visíveis em coleções públicas)<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Detalhes da edição, ano, estado..."/></label>
   <button type="button" disabled={saving||saved} className="save-item-button" onClick={()=>void save()}>{saved?<Check size={23}/>:<ArrowRight size={22}/>} {saving?'Salvando…':saved?'Item salvo!':'Salvar no meu acervo'}</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
   {saved&&<div className="saved-actions"><Link href="/itens">Ver meus itens <ArrowRight size={16}/></Link><button onClick={reset}>Cadastrar outro</button></div>}
  </div>
 </section>
}
