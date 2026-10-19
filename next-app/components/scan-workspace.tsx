'use client'
import { useEffect,useRef,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter,useSearchParams } from 'next/navigation'
import { ArrowRight,Camera,Check,ChevronDown,ImagePlus,Layers3,ScanLine,Sparkles,X } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,CollectionRow } from '@/lib/catalog'
import { uploadImage } from '@/lib/images'
import { preparePhoto } from '@/lib/photo-preparation'
import { collectibleDetailsSchema } from '@/lib/kie-parser'
import { CATEGORIES } from '@/lib/local-catalog'
import { VehicleFields } from './vehicle-fields'
export function ScanWorkspace({aiEnabled=false}:{aiEnabled?:boolean}){return <AuthGate>{userId=><Editor userId={userId} aiEnabled={aiEnabled}/>}</AuthGate>}
function Editor({userId,aiEnabled}:{userId:string;aiEnabled:boolean}){
 const params=useSearchParams()
 const router=useRouter()
 const preferredCollection=params.get('colecao')
 const fileRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null)
 const [file,setFile]=useState<File|null>(null),[image,setImage]=useState(''),[preparing,setPreparing]=useState(false)
 const [name,setName]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState<string>('Miniaturas')
 const [collectionIds,setCollectionIds]=useState<string[]>([]),[notes,setNotes]=useState('')
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [saving,setSaving]=useState(false),[recognizing,setRecognizing]=useState(false),[scanStage,setScanStage]=useState(0)
 const [details,setDetails]=useState({manufacturer:'',series:'',seriesNumber:'',collectionNumber:'',year:'',scale:'',color:'',condition:''})
 const [vehicleDetails,setVehicleDetails]=useState<Record<string,string>>({})
 const requestId=useRef(0)
 const savingRef=useRef(false)
 const [analysisError,setAnalysisError]=useState('')
 const [notice,setNotice]=useState(''),[saved,setSaved]=useState(false)
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  void db.from('collections').select('*').eq('owner_id',userId).order('created_at').then(({data})=>{const list=(data||[]) as CollectionRow[];setCollections(list);if(preferredCollection&&list.some(x=>x.id===preferredCollection))setCollectionIds([preferredCollection])})
 },[userId,preferredCollection])
 useEffect(()=>{if(!file){setImage('');return};const url=URL.createObjectURL(file);setImage(url);return ()=>URL.revokeObjectURL(url)},[file])
 async function pick(e:ChangeEvent<HTMLInputElement>){
  const chosen=e.target.files?.[0];e.target.value='';if(!chosen)return
  setPreparing(true);setNotice('Preparando a fotografia…')
  try{
   const prepared=await preparePhoto(chosen)
   setVehicleDetails({});setFile(prepared.file);setSaved(false);setName('');setBrand('');setNotes('');setAnalysisError('');setDetails({manufacturer:'',series:'',seriesNumber:'',collectionNumber:'',year:'',scale:'',color:'',condition:''})
   setNotice('Fotografia otimizada para até 600 KB. Estamos identificando seu item…')
  }catch(error){setNotice(error instanceof Error?error.message:'Não foi possível abrir a fotografia. Tente novamente.')}
  finally{setPreparing(false)}
 }
 useEffect(()=>{if(!file||!aiEnabled||saved)return
  const id=++requestId.current
  const controller=new AbortController()
  async function run(){
   setRecognizing(true);setScanStage(1);setAnalysisError('')
   try{
    const form=new FormData();form.append('image',file!)
    setScanStage(2)
    const response=await fetch('/api/recognize',{method:'POST',body:form,signal:controller.signal})
    const data=await response.json() as {error?:string;suggestion?:{name:string;brand:string;category:string;notes:string;visibleText:string;confidence:string;details?:Record<string,unknown>}}
    if(!response.ok||!data.suggestion)throw new Error(data.error||'A análise não foi concluída.')
    if(id!==requestId.current)return
    setScanStage(3)
    const item=data.suggestion
    if(item.name)setName(item.name)
    if(item.brand)setBrand(item.brand)
    if(CATEGORIES.some(c=>c.name===item.category))setCategory(item.category)
    if(item.notes)setNotes(item.notes)
    const parsed=collectibleDetailsSchema.safeParse(item.details||{})
    if(parsed.success){const d=parsed.data;setDetails({manufacturer:d.manufacturer,series:d.series,seriesNumber:d.seriesNumber,collectionNumber:d.collectionNumber,year:d.year===null?'':String(d.year),scale:d.scale,color:d.color,condition:d.condition})}
    setNotice('Ficha identificada! Confira os detalhes antes de salvar.')
   }catch(error){if(controller.signal.aborted||id!==requestId.current)return;setAnalysisError(error instanceof Error?error.message:'A análise falhou. Você pode preencher manualmente.');setNotice('Não foi possível identificar automaticamente. Você pode preencher manualmente.')}
   finally{if(id===requestId.current)setRecognizing(false)}
  }
  void run()
  return ()=>{controller.abort();requestId.current++}
 },[file,aiEnabled])
 async function save(){
  if(savingRef.current||saving||preparing||recognizing||saved)return
  if(!name.trim()){setNotice('Dê um nome ao item.');document.getElementById('item-name')?.focus();return}
  const db=getBrowserClient();if(!db)return
  savingRef.current=true
  setSaving(true);setNotice('');setSaved(false)
  let uploaded:string|null=null
  try {
   if(file)uploaded=await uploadImage(db,userId,file)
   const {data:itemId,error}=await db.rpc('create_item_with_details',{
    p_name:name.trim(),p_brand:brand.trim(),p_category:category,p_notes:notes.trim(),
    p_photo_path:uploaded,p_collection_ids:collectionIds,p_details:category==='Miniaturas'?{...details,...vehicleDetails,year:details.year?Number(details.year):null}:{}
   })
   if(error||!itemId)throw error||new Error('Não foi possível salvar o item.')
   setSaved(true)
   setNotice('Item salvo! Abrindo sua ficha…')
   router.replace('/item/'+encodeURIComponent(String(itemId)))
  }catch{
   // The RPC commits both metadata and relationships or neither.
   if(uploaded)await db.storage.from(BUCKET).remove([uploaded])
   setNotice('Não foi possível salvar o item agora. Seus dados não foram alterados. Tente novamente.')
  }finally{savingRef.current=false;setSaving(false)}
 }
 function reset(){requestId.current++;setVehicleDetails({});setDetails({manufacturer:'',series:'',seriesNumber:'',collectionNumber:'',year:'',scale:'',color:'',condition:''});setAnalysisError('');setFile(null);setName('');setBrand('');setCategory('Miniaturas');setNotes('');setCollectionIds(preferredCollection?[preferredCollection]:[]);setSaved(false);setNotice('')}
 return <section className="scan-workspace">
  <div className={'scanner-stage '+(image?'has-image ':'')+((recognizing||preparing)?'is-scanning':'')}>
   {image?<div className="ocr-preview-frame"><img className="scanner-photo" src={image} alt="Prévia da fotografia do item"/></div>:<div className="scanner-placeholder"><div className="scanner-symbol"><ScanLine size={58}/></div><strong>Aponte. Fotografe.<br/>Colecione.</strong><p>Seu acervo, um item de cada vez.</p></div>}
   {image&&(recognizing||preparing)&&<div className="photo-scan-overlay" role="status" aria-live="polite"><div className="photo-scan-grid" aria-hidden="true"/><div className="photo-scan-laser" aria-hidden="true"/><div className="photo-scan-status"><Sparkles size={18}/><strong>{preparing||scanStage===1?"Preparando imagem":scanStage===2?"Identificando sua miniatura":"Organizando detalhes"}</strong><span>Lendo a embalagem, o modelo e a série…</span></div></div>}
   <div className="scanner-corners" aria-hidden="true"><i/><i/><i/><i/></div><span className="scanner-pill"><span/> CÂMERA / GALERIA</span>
   {file&&!recognizing&&<button type="button" className="photo-clear" aria-label="Remover imagem" onClick={()=>setFile(null)}><X size={20}/></button>}
  </div>
  {preparing&&<p role="status" className="scan-notice">Preparando fotografia para o cadastro…</p>}
  <div className="capture-button-row"><button className="capture-secondary" onClick={()=>fileRef.current?.click()} aria-label="Selecionar fotografia"><ImagePlus size={26}/></button><button className="shutter-button" onClick={()=>cameraRef.current?.click()} aria-label="Abrir a câmera"><Camera size={34}/></button><button className="capture-secondary" onClick={()=>document.getElementById('item-name')?.focus()} aria-label="Preencher manualmente"><Layers3 size={25}/></button></div>
  <div className="scan-methods"><button onClick={()=>cameraRef.current?.click()}><Camera size={16}/> Tirar foto</button><button onClick={()=>fileRef.current?.click()}><ImagePlus size={16}/> Galeria</button></div>
  <input className="visually-hidden" aria-label="Capturar foto" ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e=>void pick(e)}/>
  <input className="visually-hidden" aria-label="Escolher foto" ref={fileRef} type="file" accept="image/*,.heic,.heif" onChange={e=>void pick(e)}/>

  {analysisError&&<div role="alert" className="ai-magic-error"><strong>A análise automática não terminou.</strong><p>{analysisError}</p><span>Você ainda pode cadastrar o item manualmente.</span></div>}
  {!aiEnabled&&<p className="scan-notice">O reconhecimento inteligente está temporariamente indisponível. Preencha os campos manualmente.</p>}
  <div className="item-form"><div className="section-title-inline"><div><p className="kicker">REVISE ANTES DE SALVAR</p><h2>Ficha do<br/><em>seu item.</em></h2></div><span className="form-sticker" aria-hidden="true">✦</span></div>
   <label className="field-label" htmlFor="item-name">Nome do item *<input id="item-name" maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Porsche 911 GT3 RS"/></label>
   <div className="form-double"><label className="field-label" htmlFor="item-brand">Marca<input id="item-brand" maxLength={70} value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Fabricante"/></label><label className="field-label" htmlFor="item-category">Categoria<span className="select-wrap"><select id="item-category" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label></div>
   {category==='Miniaturas'&&<section className="diecast-fields"><div className="section-title-inline"><div><p className="kicker">IDENTIDADE DA MINIATURA</p><h3>Detalhes do modelo</h3></div><Sparkles size={21}/></div><div className="diecast-field-grid">{([
    ['manufacturer','Montadora','Ex.: Honda'],
    ['series','Série','Ex.: Compact Kings'],
    ['seriesNumber','Número na série','Ex.: 4/10'],
    ['collectionNumber','Numeração geral','Ex.: 105/250'],
    ['year','Ano da cartela','Somente se visível'],
    ['scale','Escala','Ex.: 1:64'],
    ['color','Cor','Ex.: Vermelho'],
    ['condition','Condição','Ex.: Lacrado']
   ] as const).map(([key,label,placeholder])=><label key={key} className="field-label">{label}<input value={details[key]} onChange={e=>setDetails(v=>({...v,[key]:e.target.value}))} placeholder={placeholder} maxLength={key==='year'?4:90} inputMode={key==='year'?'numeric':'text'}/></label>)}</div><VehicleFields values={vehicleDetails} onChange={(key,value)=>setVehicleDetails(v=>({...v,[key]:value}))}/></section>}
   <fieldset className="collection-selector"><legend>Adicionar a coleções (opcional)</legend>{collections.length?collections.map(c=><label key={c.id}><input type="checkbox" checked={collectionIds.includes(c.id)} onChange={e=>setCollectionIds(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}</label>):<p>Você ainda não possui coleções. <Link href="/colecoes">Criar coleção</Link></p>}</fieldset>
   <label className="field-label" htmlFor="item-notes">Observações pessoais (podem ser visíveis em coleções públicas)<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="História, origem, conservação ou notas pessoais..."/></label>
   <button type="button" disabled={saving||preparing||recognizing||saved} className="save-item-button" onClick={()=>void save()}>{saved?<Check size={23}/>:<ArrowRight size={22}/>} {saving?'Salvando…':saved?'Item salvo!':'Salvar no meu acervo'}</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
   {saved&&<div className="saved-actions">{preferredCollection&&<Link href={'/colecao/'+encodeURIComponent(preferredCollection)}>Voltar à coleção <ArrowRight size={16}/></Link>}<Link href="/itens">Ver meus itens <ArrowRight size={16}/></Link><button onClick={reset}>Cadastrar outro</button></div>}
  </div>
 </section>
}
