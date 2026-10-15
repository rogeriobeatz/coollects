'use client'
import { useEffect,useRef,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight,Camera,Check,ChevronDown,ImagePlus,Layers3,ScanLine,Sparkles,X } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,CollectionRow } from '@/lib/catalog'
import { uploadImage } from '@/lib/images'
import { recognizeLocal } from '@/lib/ocr'
import { CATEGORIES } from '@/lib/local-catalog'
export function ScanWorkspace({aiEnabled=false}:{aiEnabled?:boolean}){return <AuthGate>{userId=><Editor userId={userId} aiEnabled={aiEnabled}/>}</AuthGate>}
function Editor({userId,aiEnabled}:{userId:string;aiEnabled:boolean}){
 const params=useSearchParams()
 const preferredCollection=params.get('colecao')
 const fileRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null)
 const [file,setFile]=useState<File|null>(null),[image,setImage]=useState('')
 const [name,setName]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState<string>('Miniaturas')
 const [collectionIds,setCollectionIds]=useState<string[]>([]),[notes,setNotes]=useState('')
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [saving,setSaving]=useState(false),[recognizing,setRecognizing]=useState(false),[ocrBusy,setOcrBusy]=useState(false),[ocrProgress,setOcrProgress]=useState(0),[ocrText,setOcrText]=useState('')
 const [notice,setNotice]=useState(''),[saved,setSaved]=useState(false)
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  void db.from('collections').select('*').eq('owner_id',userId).order('created_at').then(({data})=>{const list=(data||[]) as CollectionRow[];setCollections(list);if(preferredCollection&&list.some(x=>x.id===preferredCollection))setCollectionIds([preferredCollection])})
 },[userId,preferredCollection])
 useEffect(()=>{if(!file){setImage('');return};const url=URL.createObjectURL(file);setImage(url);return ()=>URL.revokeObjectURL(url)},[file])
 function pick(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];e.target.value='';if(!f)return
  if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){setNotice('Use JPG, PNG ou WebP de até 5 MB.');return}
  setFile(f);setOcrText('');setOcrProgress(0);setSaved(false);setNotice('Foto selecionada. Use Ler textos da foto para preencher a ficha.')
 }
 async function localOcr(){
  if(!file||ocrBusy)return
  setOcrBusy(true);setOcrProgress(0);setNotice('Preparando leitura da fotografia…')
  try{
   const suggestion=await recognizeLocal(file,setOcrProgress)
   setOcrText(suggestion.visibleText)
   if(suggestion.name)setName(v=>v||suggestion.name)
   if(suggestion.brand)setBrand(v=>v||suggestion.brand)
   if(suggestion.name||suggestion.brand)setCategory('Miniaturas')
   setNotice(suggestion.name||suggestion.brand?'Leitura concluída! Confira o nome e os dados sugeridos antes de salvar.':'Leitura concluída, mas não foi possível identificar o modelo. Confira o texto ou preencha manualmente.')
  }catch{setNotice('Não foi possível ler esta foto. Experimente luz uniforme, cartela reta e texto em foco.')}
  finally{setOcrBusy(false)}
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
  let uploaded:string|null=null
  try {
   if(file)uploaded=await uploadImage(db,userId,file)
   const {data:itemId,error}=await db.rpc('create_item_with_collections',{
    p_name:name.trim(),p_brand:brand.trim(),p_category:category,p_notes:notes.trim(),
    p_photo_path:uploaded,p_collection_ids:collectionIds
   })
   if(error||!itemId)throw error||new Error('Não foi possível salvar o item.')
   setSaved(true)
   setNotice('Seu item foi salvo com sucesso!')
  }catch{
   // The RPC commits both metadata and relationships or neither.
   if(uploaded)await db.storage.from(BUCKET).remove([uploaded])
   setNotice('Não foi possível salvar o item agora. Seus dados não foram alterados. Tente novamente.')
  }finally{setSaving(false)}
 }
 function reset(){setOcrText('');setOcrProgress(0);setFile(null);setName('');setBrand('');setCategory('Miniaturas');setNotes('');setCollectionIds(preferredCollection?[preferredCollection]:[]);setSaved(false);setNotice('')}
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
  <div className="ocr-panel"><div className="ai-ribbon"><ScanLine size={24}/><div><strong>Leitura automática de cartelas</strong><p>OCR gratuito no seu aparelho, sem Gemini. Leia textos da embalagem e confira as sugestões.</p></div></div><button className="ai-button" type="button" disabled={!file||ocrBusy||recognizing||saving||saved} onClick={()=>void localOcr()}><ScanLine size={18}/>{ocrBusy?'Lendo textos… '+ocrProgress+'%':'Ler textos da foto (OCR)'}</button>{ocrText&&<details className="ocr-extracted"><summary>Ver textos encontrados</summary><p>{ocrText}</p><span>O OCR não garante a identificação exata do modelo ou edição.</span></details>}</div>
  {aiEnabled&&<><div className="ai-ribbon"><Sparkles size={24}/><div><strong>Leitura inteligente</strong><p>OCR e IA sugerem os dados visíveis. Você decide o que salvar. Limite de 10 leituras por dia.</p></div></div>
  <button className="ai-button" type="button" disabled={!file||recognizing||ocrBusy||saving} onClick={()=>void recognize()}><Sparkles size={18}/>{recognizing?'Analisando imagem…':'Reconhecer com IA'}</button></>}
  <div className="item-form"><div className="section-title-inline"><div><p className="kicker">REVISE ANTES DE SALVAR</p><h2>Ficha do<br/><em>seu item.</em></h2></div><span className="form-sticker" aria-hidden="true">✦</span></div>
   <label className="field-label" htmlFor="item-name">Nome do item *<input id="item-name" maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Porsche 911 GT3 RS"/></label>
   <div className="form-double"><label className="field-label" htmlFor="item-brand">Marca<input id="item-brand" maxLength={70} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Fabricante"/></label><label className="field-label" htmlFor="item-category">Categoria<span className="select-wrap"><select id="item-category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label></div>
   <fieldset className="collection-selector"><legend>Adicionar a coleções (opcional)</legend>{collections.length?collections.map(c=><label key={c.id}><input type="checkbox" checked={collectionIds.includes(c.id)} onChange={e=>setCollectionIds(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}</label>):<p>Você ainda não possui coleções. <Link href="/colecoes">Criar coleção</Link></p>}</fieldset>
   <label className="field-label" htmlFor="item-notes">Observações (podem ser visíveis em coleções públicas)<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Detalhes da edição, ano, estado..."/></label>
   <button type="button" disabled={saving||saved} className="save-item-button" onClick={()=>void save()}>{saved?<Check size={23}/>:<ArrowRight size={22}/>} {saving?'Salvando…':saved?'Item salvo!':'Salvar no meu acervo'}</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
   {saved&&<div className="saved-actions">{preferredCollection&&<Link href={'/colecao/'+encodeURIComponent(preferredCollection)}>Voltar à coleção <ArrowRight size={16}/></Link>}<Link href="/itens">Ver meus itens <ArrowRight size={16}/></Link><button onClick={reset}>Cadastrar outro</button></div>}
  </div>
 </section>
}
