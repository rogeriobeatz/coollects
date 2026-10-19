'use client'
import { useEffect,useRef,useState,type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter,useSearchParams } from 'next/navigation'
import { ArrowRight,Camera,Check,Plus,ChevronDown,FolderPlus,ImagePlus,NotebookPen,PencilLine,RotateCcw,ScanLine,Sparkles,X } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { AnalysisProgress } from './analysis-progress'
import { getBrowserClient } from '@/lib/supabase/client'
import { BUCKET,CollectionRow } from '@/lib/catalog'
import { uploadImage } from '@/lib/images'
import { preparePhoto } from '@/lib/photo-preparation'
import { MAX_ITEM_PHOTOS } from '@/lib/photo-limits'
import { collectibleDetailsSchema } from '@/lib/kie-parser'
import { CATEGORIES } from '@/lib/local-catalog'
import { VehicleFields } from './vehicle-fields'

type Photo={id:string;file:File;url:string}
type Details={manufacturer:string;series:string;seriesNumber:string;collectionNumber:string;year:string;scale:string;color:string;condition:string}
type DetailKey=keyof Details
type Suggestion={name:string;brand:string;category:string;notes:string;visibleText:string;confidence:'low'|'medium'|'high';details?:Record<string,unknown>}
type Analysis={status:'idle'|'running'|'finishing'|'done'|'error';startedAt:number;error:string;filled:number;confidence:Suggestion['confidence']|null}

const EMPTY_DETAILS:Details={manufacturer:'',series:'',seriesNumber:'',collectionNumber:'',year:'',scale:'',color:'',condition:''}
const IDLE:Analysis={status:'idle',startedAt:0,error:'',filled:0,confidence:null}
const PRIMARY_DETAILS:[DetailKey,string,string][]=[['manufacturer','Montadora','Ex.: Honda'],['series','Série','Ex.: Compact Kings'],['seriesNumber','Número na série','Ex.: 4/10'],['collectionNumber','Numeração geral','Ex.: 105/250']]
const EXTRA_DETAILS:[DetailKey,string,string][]=[['year','Ano da cartela','Somente se impresso'],['scale','Escala','Ex.: 1:64'],['color','Cor','Ex.: Vermelho'],['condition','Condição','Ex.: Lacrado']]
/** Keep the finished bar on screen briefly so the result does not "jump" in. */
const FINISH_HOLD_MS=700

export function ScanWorkspace({aiEnabled=false}:{aiEnabled?:boolean}){return <AuthGate>{userId=><Editor userId={userId} aiEnabled={aiEnabled}/>}</AuthGate>}

function Editor({userId,aiEnabled}:{userId:string;aiEnabled:boolean}){
 const params=useSearchParams()
 const router=useRouter()
 const preferredCollection=params.get('colecao')
 const galleryRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null)
 const notesRef=useRef<HTMLDetailsElement>(null),collectionsRef=useRef<HTMLFieldSetElement>(null)
 const [photos,setPhotos]=useState<Photo[]>([]),[preparing,setPreparing]=useState(0)
 const [name,setName]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState<string>('Miniaturas')
 const [details,setDetails]=useState<Details>(EMPTY_DETAILS)
 const [vehicleDetails,setVehicleDetails]=useState<Record<string,string>>({})
 const [notes,setNotes]=useState('')
 const [collectionIds,setCollectionIds]=useState<string[]>([])
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [analysis,setAnalysis]=useState<Analysis>(IDLE)
 const [aiFilled,setAiFilled]=useState<Set<string>>(new Set())
 const [saving,setSaving]=useState(false)
 const [notice,setNotice]=useState('')
 const [lastSaved,setLastSaved]=useState<{id:string;name:string}|null>(null)
 const savingRef=useRef(false)
 const requestId=useRef(0)
 const abortRef=useRef<AbortController|null>(null)
 // Fields the person typed in. The AI never overwrites them.
 const touched=useRef(new Set<string>())
 const analyzedId=useRef<string|null>(null)
 // Set when the person chooses to fill the form by hand after a failure.
 const manualOnly=useRef(false)
 const photosRef=useRef<Photo[]>([])
 photosRef.current=photos
 const busy=analysis.status==='running'||analysis.status==='finishing'

 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  void db.from('collections').select('*').eq('owner_id',userId).order('created_at').then(({data})=>{
   const list=(data||[]) as CollectionRow[];setCollections(list)
   if(preferredCollection&&list.some(x=>x.id===preferredCollection))setCollectionIds([preferredCollection])
  })
 },[userId,preferredCollection])
 // Release preview URLs and any pending request when leaving the page.
 useEffect(()=>()=>{photosRef.current.forEach(p=>URL.revokeObjectURL(p.url));abortRef.current?.abort()},[])

 // Only the main (first) photo is analyzed, once, until a result is applied.
 const main=photos[0]
 useEffect(()=>{
  if(!main||!aiEnabled||manualOnly.current||analysis.status==='done'||analyzedId.current===main.id)return
  void analyze(main)
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[main?.id,aiEnabled])

 function edited(key:string){
  touched.current.add(key)
  setAiFilled(v=>{if(!v.has(key))return v;const next=new Set(v);next.delete(key);return next})
 }

 async function analyze(photo:Photo){
  analyzedId.current=photo.id
  abortRef.current?.abort()
  const controller=new AbortController();abortRef.current=controller
  const id=++requestId.current
  setAnalysis({...IDLE,status:'running',startedAt:Date.now()})
  try{
   const form=new FormData();form.append('image',photo.file)
   const response=await fetch('/api/recognize',{method:'POST',body:form,signal:controller.signal})
   const data=await response.json().catch(()=>({})) as {error?:string;suggestion?:Suggestion}
   if(!response.ok||!data.suggestion)throw new Error(data.error||'A análise não foi concluída.')
   if(id!==requestId.current)return
   const filled=apply(data.suggestion)
   setAnalysis(v=>({...v,status:'finishing',filled,confidence:data.suggestion!.confidence}))
   window.setTimeout(()=>{if(id===requestId.current)setAnalysis(v=>({...v,status:'done'}))},FINISH_HOLD_MS)
  }catch(error){
   if(controller.signal.aborted||id!==requestId.current)return
   setAnalysis(v=>({...v,status:'error',error:error instanceof Error?error.message:'A análise falhou.'}))
  }
 }

 function apply(s:Suggestion){
  const filled=new Set<string>()
  const take=(key:string,value:string,set:(v:string)=>void)=>{if(!value||touched.current.has(key))return;set(value);filled.add(key)}
  take('name',s.name,setName)
  take('brand',s.brand,setBrand)
  take('notes',s.notes,setNotes)
  if(CATEGORIES.some(c=>c.name===s.category)&&!touched.current.has('category'))setCategory(s.category)
  const parsed=collectibleDetailsSchema.safeParse(s.details||{})
  if(parsed.success){
   const next:Partial<Details>={}
   for(const key of Object.keys(EMPTY_DETAILS) as DetailKey[]){
    const raw=parsed.data[key],value=raw===null||raw===undefined?'':String(raw)
    if(value&&!touched.current.has('d.'+key)){next[key]=value;filled.add('d.'+key)}
   }
   setDetails(v=>({...v,...next}))
  }
  if(filled.has('notes')&&notesRef.current)notesRef.current.open=true
  setAiFilled(filled)
  return filled.size
 }

 function cancelAnalysis(){
  requestId.current++;abortRef.current?.abort()
  setAnalysis(IDLE)
 }

 async function addPhotos(e:ChangeEvent<HTMLInputElement>){
  const chosen=Array.from(e.target.files||[]);e.target.value=''
  if(!chosen.length)return
  const room=MAX_ITEM_PHOTOS-photosRef.current.length
  if(room<=0){setNotice('Limite de '+MAX_ITEM_PHOTOS+' fotos por item.');return}
  const accepted=chosen.slice(0,room)
  setPreparing(accepted.length);setNotice('')
  const failures:string[]=[]
  for(const file of accepted){
   try{
    const prepared=await preparePhoto(file)
    const photo={id:crypto.randomUUID(),file:prepared.file,url:URL.createObjectURL(prepared.file)}
    setPhotos(v=>[...v,photo])
   }catch(error){failures.push(error instanceof Error?error.message:'Não foi possível abrir uma das fotos.')}
   finally{setPreparing(n=>Math.max(0,n-1))}
  }
  if(failures.length)setNotice(failures[0])
  else if(chosen.length>room)setNotice('Adicionamos '+room+' foto(s). O limite é de '+MAX_ITEM_PHOTOS+' por item.')
 }

 function removePhoto(id:string){
  const photo=photos.find(p=>p.id===id);if(!photo)return
  URL.revokeObjectURL(photo.url)
  // Removing the main photo while it is analyzed cancels that analysis; the
  // next photo becomes the main one and is analyzed if nothing was filled yet.
  if(photos[0]?.id===id&&busy)cancelAnalysis()
  setPhotos(v=>v.filter(p=>p.id!==id))
 }

 function makeMain(id:string){
  setPhotos(v=>{const photo=v.find(p=>p.id===id);return photo?[photo,...v.filter(p=>p.id!==id)]:v})
 }

 function openGallery(){galleryRef.current?.click()}
 function focusCollections(){collectionsRef.current?.scrollIntoView({behavior:'smooth',block:'center'});collectionsRef.current?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true})}
 function focusNotes(){if(notesRef.current){notesRef.current.open=true;notesRef.current.scrollIntoView({behavior:'smooth',block:'center'});notesRef.current.querySelector('textarea')?.focus({preventScroll:true})}}

 async function save(next:'view'|'another'='view'){
  if(savingRef.current||saving||preparing||busy)return
  if(!name.trim()){setNotice('Dê um nome ao item.');document.getElementById('item-name')?.focus();return}
  const db=getBrowserClient();if(!db)return
  savingRef.current=true;setSaving(true);setNotice('')
  const uploaded:string[]=[]
  try{
   // Upload in parallel; remember every success so a failure can clean up.
   const results=await Promise.allSettled(photos.map(p=>uploadImage(db,userId,p.file).then(path=>{uploaded.push(path);return path})))
   if(results.some(r=>r.status==='rejected'))throw new Error('upload')
   const paths=results.map(r=>(r as PromiseFulfilledResult<string>).value)
   const payload={
    p_name:name.trim(),p_brand:brand.trim(),p_category:category,p_notes:notes.trim(),
    p_photo_path:paths[0]??null,p_collection_ids:collectionIds,
    p_details:category==='Miniaturas'?{...details,...vehicleDetails,year:details.year?Number(details.year):null}:{}
   }
   // Without extra photos keep using the original RPC.
   const {data:itemId,error}=paths.length>1
    ?await db.rpc('create_item_with_gallery',{...payload,p_gallery_paths:paths.slice(1)})
    :await db.rpc('create_item_with_details',payload)
   if(error||!itemId)throw error||new Error('Não foi possível salvar o item.')
   if(next==='another'){
    setLastSaved({id:String(itemId),name:name.trim()})
    startOver()
    savingRef.current=false;setSaving(false)
    window.scrollTo({top:0,behavior:'smooth'})
    return
   }
   setNotice('Item salvo! Abrindo sua ficha…')
   router.replace('/item/'+encodeURIComponent(String(itemId)))
  }catch{
   // The RPC commits metadata, links and gallery together, or nothing.
   if(uploaded.length)await db.storage.from(BUCKET).remove(uploaded)
   setNotice('Não foi possível salvar o item agora. Seus dados não foram alterados. Tente novamente.')
   savingRef.current=false;setSaving(false)
  }
 }

 /** Clears the form for the next item; keeps the chosen collections. */
 function startOver(){
  cancelAnalysis()
  photosRef.current.forEach(p=>URL.revokeObjectURL(p.url))
  setPhotos([]);setName('');setBrand('');setNotes('');setDetails(EMPTY_DETAILS);setVehicleDetails({})
  setAiFilled(new Set());setNotice('')
  touched.current.clear();analyzedId.current=null;manualOnly.current=false
  if(notesRef.current)notesRef.current.open=false
 }

 const field=(key:string)=>'field-label'+(aiFilled.has(key)?' is-ai-filled':'')
 const extraFilled=EXTRA_DETAILS.filter(([key])=>details[key]).length
 const canAddMore=photos.length<MAX_ITEM_PHOTOS
 const showProgress=aiEnabled&&busy

 return <section className="scan-workspace">
  {lastSaved&&<div role="status" className="saved-banner"><Check size={18} aria-hidden="true"/><p><strong>“{lastSaved.name}” salvo!</strong> Pronto para o próximo.</p><Link href={'/item/'+encodeURIComponent(lastSaved.id)}>Ver item</Link><button type="button" aria-label="Fechar aviso" onClick={()=>setLastSaved(null)}><X size={16}/></button></div>}
  <div className={'scanner-stage '+(main?'has-image ':'')+(busy||(preparing&&!main)?'is-scanning':'')}>
   {main
    ?<div className="ocr-preview-frame"><img className="scanner-photo" src={main.url} alt="Foto principal do item"/></div>
    :<div className="scanner-placeholder"><div className="scanner-symbol"><ScanLine size={58}/></div><strong>Aponte. Fotografe.<br/>Colecione.</strong><p>{aiEnabled?'A primeira foto preenche a ficha automaticamente.':'Seu acervo, um item de cada vez.'}</p></div>}
   {main&&busy&&<div className="photo-scan-overlay" aria-hidden="true"><div className="photo-scan-grid"/><div className="photo-scan-laser"/></div>}
   {!main&&<div className="scanner-corners" aria-hidden="true"><i/><i/><i/><i/></div>}
  </div>

  {!main&&<div className="capture-actions">
   <button type="button" className="capture-primary" onClick={()=>cameraRef.current?.click()} disabled={preparing>0}><Camera size={22}/> Tirar foto</button>
   <button type="button" className="capture-alt" onClick={openGallery} disabled={preparing>0}><ImagePlus size={20}/> Galeria</button>
   <button type="button" className="capture-skip" onClick={()=>document.getElementById('item-name')?.focus()}><PencilLine size={16}/> Cadastrar sem foto</button>
  </div>}

  {main&&<div className="photo-strip" role="list" aria-label="Fotos do item">
   {photos.map((p,i)=><div role="listitem" key={p.id} className={'photo-thumb'+(i===0?' is-main':'')}>
    {i===0?<img src={p.url} alt="Foto principal"/>:<button type="button" className="photo-thumb-select" onClick={()=>makeMain(p.id)} aria-label={'Usar foto '+(i+1)+' como principal'} disabled={busy}><img src={p.url} alt=""/></button>}
    {i===0&&<span className="photo-thumb-badge">{aiEnabled?<><Sparkles size={11}/> IA</>:'Capa'}</span>}
    <button type="button" className="photo-thumb-remove" aria-label={'Remover foto '+(i+1)} onClick={()=>removePhoto(p.id)} disabled={saving}><X size={14}/></button>
   </div>)}
   {Array.from({length:preparing}).map((_,i)=><div key={'prep'+i} className="photo-thumb is-loading" role="listitem" aria-label="Preparando foto"/>)}
   {canAddMore&&!preparing&&<button type="button" className="photo-thumb photo-thumb-add" onClick={openGallery}><ImagePlus size={20}/><span>Foto</span></button>}
  </div>}
  {main&&<p className="photo-strip-hint">{photos.length}/{MAX_ITEM_PHOTOS} fotos{aiEnabled?' · só a principal é analisada pela IA':''}{photos.length>1?' · toque numa miniatura para torná-la principal':''}</p>}

  <input className="visually-hidden" aria-label="Capturar foto" ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e=>void addPhotos(e)}/>
  <input className="visually-hidden" aria-label="Escolher foto" ref={galleryRef} type="file" accept="image/*,.heic,.heif" multiple onChange={e=>void addPhotos(e)}/>
  {preparing>0&&!main&&<p role="status" className="scan-notice">Preparando a foto…</p>}

  {showProgress&&<AnalysisProgress startedAt={analysis.startedAt} done={analysis.status==='finishing'}>
   {canAddMore&&<button type="button" onClick={openGallery}><ImagePlus size={16}/> Adicionar fotos do verso ou detalhes</button>}
   <button type="button" onClick={focusCollections}><FolderPlus size={16}/> Escolher coleções</button>
   <button type="button" onClick={focusNotes}><NotebookPen size={16}/> Escrever uma observação</button>
  </AnalysisProgress>}

  {analysis.status==='error'&&<div role="alert" className="ai-magic-error">
   <strong>Não conseguimos identificar automaticamente.</strong><p>{analysis.error}</p>
   <div className="ai-error-actions">{main&&<button type="button" onClick={()=>{manualOnly.current=false;void analyze(main)}}><RotateCcw size={15}/> Tentar de novo</button>}<button type="button" onClick={()=>{manualOnly.current=true;setAnalysis(IDLE);document.getElementById('item-name')?.focus()}}>Preencher manualmente</button></div>
  </div>}
  {analysis.status==='done'&&<p role="status" className={'ai-result-summary'+(analysis.confidence==='low'||!analysis.filled?' is-uncertain':'')}>
   <Sparkles size={16} aria-hidden="true"/>
   {!analysis.filled?'Não encontramos textos legíveis na foto. Preencha os campos abaixo.':analysis.confidence==='low'?'A IA preencheu '+analysis.filled+' campo(s), mas a identificação ficou incerta. Confira com atenção.':'A IA preencheu '+analysis.filled+' campo(s), destacados abaixo. Confira antes de salvar.'}
  </p>}
  {!aiEnabled&&<p className="scan-notice">O reconhecimento inteligente está temporariamente indisponível. Preencha os campos manualmente.</p>}

  <div className={'item-form'+(busy?' is-waiting-ai':'')}>
   <h2 className="item-form-title">Ficha do item</h2>
   <label className={field('name')} htmlFor="item-name">Nome do item *<input id="item-name" maxLength={90} value={name} onChange={e=>{edited('name');setName(e.target.value)}} placeholder={busy?'A IA está lendo a foto…':'Ex.: Porsche 911 GT3 RS'}/></label>
   <div className="form-double">
    <label className={field('brand')} htmlFor="item-brand">Marca<input id="item-brand" maxLength={70} value={brand} onChange={e=>{edited('brand');setBrand(e.target.value)}} placeholder="Ex.: Hot Wheels"/></label>
    <label className="field-label" htmlFor="item-category">Categoria<span className="select-wrap"><select id="item-category" value={category} onChange={e=>{edited('category');setCategory(e.target.value)}}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select><ChevronDown size={17}/></span></label>
   </div>

   {category==='Miniaturas'&&<section className="diecast-fields" aria-label="Detalhes da miniatura">
    <div className="diecast-field-grid">{PRIMARY_DETAILS.map(([key,label,placeholder])=><label key={key} className={field('d.'+key)}>{label}<input value={details[key]} onChange={e=>{edited('d.'+key);setDetails(v=>({...v,[key]:e.target.value}))}} placeholder={placeholder} maxLength={90}/></label>)}</div>
    <details className="diecast-more"><summary>Mais detalhes da cartela {extraFilled>0&&<span>{extraFilled} preenchido(s)</span>}</summary>
     <div className="diecast-field-grid">{EXTRA_DETAILS.map(([key,label,placeholder])=><label key={key} className={field('d.'+key)}>{label}<input value={details[key]} onChange={e=>{edited('d.'+key);setDetails(v=>({...v,[key]:e.target.value}))}} placeholder={placeholder} maxLength={key==='year'?4:90} inputMode={key==='year'?'numeric':'text'}/></label>)}</div>
    </details>
    <VehicleFields values={vehicleDetails} onChange={(key,value)=>setVehicleDetails(v=>({...v,[key]:value}))}/>
   </section>}

   <fieldset ref={collectionsRef} className="collection-selector"><legend>Adicionar a coleções</legend>{collections.length
    ?<div className="collection-chips">{collections.map(c=><label key={c.id}><input type="checkbox" checked={collectionIds.includes(c.id)} onChange={e=>setCollectionIds(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}</label>)}</div>
    :<p>Você ainda não tem coleções. <Link href="/colecoes">Criar coleção</Link></p>}
   </fieldset>

   <details ref={notesRef} className="notes-disclosure"><summary>Observações {notes&&<span>preenchida</span>}</summary>
    <label className={field('notes')} htmlFor="item-notes">Observações pessoais (podem ser visíveis em coleções públicas)<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>{edited('notes');setNotes(e.target.value)}} placeholder="História, origem, conservação…"/></label>
   </details>

   <button type="button" disabled={saving||preparing>0||busy} className="save-item-button" onClick={()=>void save()}><ArrowRight size={22}/> {saving?'Salvando…':busy?'Aguardando a análise…':'Salvar no meu acervo'}</button>
   <button type="button" disabled={saving||preparing>0||busy} className="save-another-button" onClick={()=>void save('another')}><Plus size={18}/> Salvar e cadastrar outro</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
  </div>
 </section>
}
