'use client'
import { useEffect,useRef,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Camera, Check, ChevronDown, ImagePlus, Layers3, ScanLine, Sparkles, X } from 'lucide-react'
import { CATEGORIES,getCollections,getItems,LocalCollection,saveItems } from '@/lib/local-catalog'
export function ScanWorkspace(){
 const fileRef=useRef<HTMLInputElement>(null)
 const cameraRef=useRef<HTMLInputElement>(null)
 const [image,setImage]=useState('')
 const [filename,setFilename]=useState('')
 const [notice,setNotice]=useState('')
 const [name,setName]=useState('')
 const [brand,setBrand]=useState('')
 const [category,setCategory]=useState('Miniaturas')
 const [collectionId,setCollectionId]=useState('')
 const [notes,setNotes]=useState('')
 const [collections,setCollections]=useState<LocalCollection[]>([])
 const [saved,setSaved]=useState(false)
 useEffect(()=>{setCollections(getCollections())},[])
 useEffect(()=>()=>{if(image)URL.revokeObjectURL(image)},[image])
 function pick(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file)return
  if(!file.type.startsWith('image/')){setNotice('Selecione uma imagem válida.');return}
  if(file.size>10*1024*1024){setNotice('Escolha uma imagem com até 10 MB.');return}
  setImage(URL.createObjectURL(file));setFilename(file.name);setSaved(false);setNotice('Imagem carregada para prévia; ela não será enviada nem armazenada nesta versão.')
  e.target.value=''
 }
 function save(){
  if(!name.trim()){setNotice('Informe o nome do item para continuar.');return}
  const entry={id:crypto.randomUUID(),name:name.trim(),brand:brand.trim(),category,notes:notes.trim(),collectionId,createdAt:new Date().toISOString()}
  if(saveItems([entry,...getItems()])){setSaved(true);setNotice('Item salvo neste navegador! A foto permanece apenas na prévia.') }else setNotice('Não foi possível salvar o item. Verifique o espaço de armazenamento.')
 }
 function clear(){setImage('');setFilename('');setName('');setBrand('');setNotes('');setCollectionId('');setSaved(false);setNotice('')}
 return <section className="scan-workspace">
  <div className={'scanner-stage '+(image?'has-image':'')}>
   {image?<img className="scanner-photo" src={image} alt="Prévia do item selecionado"/>:<div className="scanner-placeholder"><div className="scanner-symbol"><ScanLine size={58}/></div><strong>Aponte. Fotografe.<br/>Colecione.</strong><p>Seu acervo, um item de cada vez.</p></div>}
   <div className="scanner-corners" aria-hidden="true"><i/><i/><i/><i/></div>
   <span className="scanner-pill"><span/> PRÉVIA DA CÂMERA</span>
   <div className="scan-stage-shape" aria-hidden="true">✳</div>
   {image&&<button className="photo-clear" onClick={clear} aria-label="Remover fotografia"><X size={20}/></button>}
  </div>
  <div className="capture-button-row">
   <button type="button" className="capture-secondary" onClick={()=>fileRef.current?.click()} aria-label="Importar foto"><ImagePlus size={26}/></button>
   <button type="button" className="shutter-button" onClick={()=>cameraRef.current?.click()} aria-label="Abrir câmera"><Camera size={34}/></button>
   <button type="button" className="capture-secondary" onClick={()=>{document.getElementById('item-name')?.focus()}} aria-label="Preencher cadastro manual"><Layers3 size={25}/></button>
  </div>
  <input type="file" accept="image/*" capture="environment" ref={cameraRef} onChange={pick} className="visually-hidden" aria-label="Capturar imagem com a câmera"/>
  <input type="file" accept="image/*" ref={fileRef} onChange={pick} className="visually-hidden" aria-label="Selecionar imagem da galeria"/>
  <div className="scan-methods"><button onClick={()=>cameraRef.current?.click()}><Camera size={16}/> Tirar foto</button><button onClick={()=>fileRef.current?.click()}><ImagePlus size={16}/> Galeria</button></div>
  {filename&&<p className="selected-file">Arquivo selecionado: {filename}</p>}
  <div className="ai-ribbon"><Sparkles size={24}/><div><strong>Reconhecimento com IA</strong><p>Em desenvolvimento. Por enquanto, revise e preencha seus dados manualmente.</p></div><span>EM BREVE</span></div>
  <div className="item-form"><div className="section-title-inline"><div><p className="kicker">QUASE LÁ</p><h2>Ficha do<br/><em>seu item.</em></h2></div><span className="form-sticker">✦</span></div>
   <label className="field-label" htmlFor="item-name">Nome do item *<input id="item-name" maxLength={90} required value={name} onChange={e=>{setName(e.target.value);setSaved(false)}} placeholder="Ex.: Porsche 911 GT3 RS"/></label>
   <div className="form-double"><label className="field-label" htmlFor="item-brand">Marca<input id="item-brand" maxLength={70} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Fabricante"/></label><label className="field-label" htmlFor="item-category">Categoria<span className="select-wrap"><select id="item-category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label></div>
   <label className="field-label" htmlFor="item-collection">Vincular a uma coleção<span className="select-wrap"><select id="item-collection" value={collectionId} onChange={e=>setCollectionId(e.target.value)}><option value="">Sem coleção, por enquanto</option>{collections.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label>
   <label className="field-label" htmlFor="item-notes">Observações<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Versão, ano, detalhes especiais..."/></label>
   <button type="button" className="save-item-button" onClick={save}>{saved?<Check size={23}/>:<ArrowRight size={22}/>} {saved?'Item salvo!':'Salvar item localmente'}</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
   {saved&&<Link className="saved-next" href="/colecoes">Ver minhas coleções <ArrowRight size={17}/></Link>}
   <p className="local-note">A imagem é somente prévia, sem upload nem persistência. Item salvo localmente; não sincroniza com outros aparelhos.</p>
  </div>
 </section>
}
