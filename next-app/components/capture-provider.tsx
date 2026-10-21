'use client'
import {createContext,useContext,useEffect,useRef,useState,type ChangeEvent,type ReactNode} from 'react'
import {usePathname,useRouter} from 'next/navigation'
import {getBrowserClient} from '@/lib/supabase/client'
import {BUCKET,notifyCatalogChanged,type CollectionRow} from '@/lib/catalog'
import {uploadImage} from '@/lib/images'
import {preparePhoto} from '@/lib/photo-preparation'
import {MAX_ITEM_PHOTOS} from '@/lib/photo-limits'
import {collectibleDetailsSchema} from '@/lib/kie-parser'
import {CATEGORIES} from '@/lib/local-catalog'
import {readAll} from '@/lib/pagination'
import {useUnsavedChanges} from './use-unsaved-changes'
import {CaptureIndicator} from './capture-indicator'

type Photo={id:string;file:File;url:string}
type Details={manufacturer:string;series:string;seriesNumber:string;collectionNumber:string;year:string;scale:string;color:string;condition:string}
export type DetailKey=keyof Details
type Suggestion={name:string;brand:string;category:string;notes:string;visibleText:string;confidence:'low'|'medium'|'high';details?:Record<string,unknown>}
type Analysis={status:'idle'|'running'|'finishing'|'done'|'error';startedAt:number;error:string;filled:number;confidence:Suggestion['confidence']|null}

const EMPTY_DETAILS:Details={manufacturer:'',series:'',seriesNumber:'',collectionNumber:'',year:'',scale:'',color:'',condition:''}
const IDLE:Analysis={status:'idle',startedAt:0,error:'',filled:0,confidence:null}
const FINISH_HOLD_MS=700

function useCaptureSession(){
 const router=useRouter()
 const pathname=usePathname()
 const pathRef=useRef(pathname);pathRef.current=pathname
 const [preferredCollection,setPreferredCollection]=useState<string|null>(null)
 const [userId,setUserId]=useState<string|null>(null)
 const [aiEnabled,setAiEnabled]=useState(false)
 const galleryRef=useRef<HTMLInputElement>(null),cameraRef=useRef<HTMLInputElement>(null)
 const notesRef=useRef<HTMLDetailsElement>(null),collectionsRef=useRef<HTMLFieldSetElement>(null)
 const [photos,setPhotos]=useState<Photo[]>([]),[preparing,setPreparing]=useState(0)
 const [name,setName]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState<string>('Miniaturas')
 const [details,setDetails]=useState<Details>(EMPTY_DETAILS)
 const [vehicleDetails,setVehicleDetails]=useState<Record<string,string>>({})
 const [notes,setNotes]=useState('')
 const [collectionIds,setCollectionIds]=useState<string[]>([])
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [collectionsLoading,setCollectionsLoading]=useState(true),[collectionsError,setCollectionsError]=useState(''),[collectionAttempt,setCollectionAttempt]=useState(0)
 const [creatingCollection,setCreatingCollection]=useState(false)
 const [originMissing,setOriginMissing]=useState(false)
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
 const hasDraft=Boolean(name||brand||notes||photos.length||preparing||touched.current.size)
 const draftRef=useRef(hasDraft);draftRef.current=hasDraft
 const ownerRef=useRef<string|null>(null)
 const epoch=useRef(0)
 const allowExit=useUnsavedChanges(!saving&&hasDraft,true)

 useEffect(()=>{
  if(!userId)return
  const db=getBrowserClient();let active=true
  setCollectionsLoading(true);setCollectionsError('');setOriginMissing(false)
  void (async()=>{
   try{
    if(!db)throw new Error('offline')
    const list=await readAll<CollectionRow>((from,to)=>db.from('collections').select('*',{count:'exact'}).eq('owner_id',userId).order('created_at').order('id').range(from,to))
    if(!active||ownerRef.current!==userId)return
    setCollections(list)
    const preferred=list.find(x=>x.id===preferredCollection)
    if(preferred){setCollectionIds(ids=>[...new Set([...ids,preferred.id])]);if(!touched.current.has('category'))setCategory(preferred.category)}
    else if(preferredCollection){setOriginMissing(true);setCollectionsError('A coleção de origem não está disponível. Escolha outra coleção ou salve sem vínculo.')}
   }catch{if(active&&ownerRef.current===userId)setCollectionsError('Não foi possível carregar suas coleções. Tente novamente antes de salvar.')}
   finally{if(active&&ownerRef.current===userId)setCollectionsLoading(false)}
  })()
  return()=>{active=false}
 },[userId,preferredCollection,collectionAttempt])
 // Dispose only when the app provider unmounts, never on route changes.
 useEffect(()=>()=>{epoch.current++;requestId.current++;photosRef.current.forEach(p=>URL.revokeObjectURL(p.url));abortRef.current?.abort()},[])

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
 function continueManually(){manualOnly.current=true;cancelAnalysis();document.getElementById('item-name')?.focus()}

 async function addPhotos(e:ChangeEvent<HTMLInputElement>){
  const operation=epoch.current
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
    if(operation!==epoch.current)return
    const photo={id:crypto.randomUUID(),file:prepared.file,url:URL.createObjectURL(prepared.file)}
    setPhotos(v=>[...v,photo])
   }catch(error){failures.push(error instanceof Error?error.message:'Não foi possível abrir uma das fotos.')}
   finally{if(operation===epoch.current)setPreparing(n=>Math.max(0,n-1))}
  }
  if(operation!==epoch.current)return
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
  if(!userId)return
  const operation=epoch.current
  if(savingRef.current||saving||preparing||busy||collectionsLoading||collectionsError)return
  if(!name.trim()){setNotice('Dê um nome ao item.');document.getElementById('item-name')?.focus();return}
  const db=getBrowserClient();if(!db)return
  savingRef.current=true;setSaving(true);setNotice('')
  const uploaded:string[]=[]
  try{
   // Upload in parallel; remember every success so a failure can clean up.
   const results=await Promise.allSettled(photos.map(p=>uploadImage(db,userId,p.file).then(path=>{uploaded.push(path);return path})))
   if(operation!==epoch.current)throw new Error('session changed')
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
   if(operation!==epoch.current)return
   notifyCatalogChanged(userId)
   if(next==='another'){
    setLastSaved({id:String(itemId),name:name.trim()})
    startOver()
    savingRef.current=false;setSaving(false)
    if(pathRef.current==='/cadastrar')window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
    return
   }
   const savedName=name.trim()
   startOver()
   setLastSaved({id:String(itemId),name:savedName})
   savingRef.current=false;setSaving(false)
   allowExit()
   if(pathRef.current==='/cadastrar')router.replace('/item/'+encodeURIComponent(String(itemId)))
  }catch{
   // The RPC commits metadata, links and gallery together, or nothing.
   if(uploaded.length)await db.storage.from(BUCKET).remove(uploaded).catch(()=>{})
   if(operation!==epoch.current)return
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


 function clearSession(){
  epoch.current++;requestId.current++;abortRef.current?.abort()
  photosRef.current.forEach(photo=>URL.revokeObjectURL(photo.url));photosRef.current=[]
  setPhotos([]);setPreparing(0);setName('');setBrand('');setCategory('Miniaturas');setDetails(EMPTY_DETAILS);setVehicleDetails({});setNotes('')
  setCollectionIds([]);setCollections([]);setCollectionsLoading(true);setCollectionsError('');setPreferredCollection(null);setOriginMissing(false);setCreatingCollection(false)
  setAnalysis(IDLE);setAiFilled(new Set());setSaving(false);setNotice('');setLastSaved(null)
  touched.current.clear();analyzedId.current=null;manualOnly.current=false;savingRef.current=false;draftRef.current=false
  ownerRef.current=null;setUserId(null)
 }
 useEffect(()=>{
  if(!lastSaved)return
  const timer=window.setTimeout(()=>setLastSaved(null),5000)
  return()=>window.clearTimeout(timer)
 },[lastSaved])
 function openDraft(id:string,enabled:boolean,preferred:string|null){
  const changed=ownerRef.current!==id
  if(changed)clearSession()
  ownerRef.current=id;setUserId(id);setAiEnabled(enabled)
  // A new shortcut must not silently replace an existing item's collection.
  if(changed||!draftRef.current)setPreferredCollection(preferred)
 }
 function discard(){
  if(!hasDraft||window.confirm('Descartar este cadastro? A foto e as alterações ainda não salvas serão perdidas.')){startOver();setLastSaved(null)}
 }
 function addCollection(collection:CollectionRow){
  if(ownerRef.current!==collection.owner_id)return
  setCollections(rows=>[...rows.filter(row=>row.id!==collection.id),collection])
  setCollectionIds(ids=>[...new Set([...ids,collection.id])]);setCreatingCollection(false)
 }
 useEffect(()=>{if(pathname!=='/cadastrar')setCreatingCollection(false)},[pathname])
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
   if(ownerRef.current&&(event==='SIGNED_OUT'||session?.user?.id&&session.user.id!==ownerRef.current))clearSession()
  })
  return()=>subscription.unsubscribe()
 },[])
 return {userId,aiEnabled,preferredCollection,galleryRef,cameraRef,notesRef,collectionsRef,photos,preparing,name,setName,brand,setBrand,category,setCategory,details,setDetails,vehicleDetails,setVehicleDetails,notes,setNotes,collectionIds,setCollectionIds,collections,collectionsLoading,collectionsError,setCollectionsError,setCollectionAttempt,creatingCollection,setCreatingCollection,originMissing,analysis,aiFilled,saving,notice,lastSaved,setLastSaved,busy,hasDraft,openDraft,discard,edited,analyze,continueManually,addPhotos,removePhoto,makeMain,openGallery,focusCollections,focusNotes,save,addCollection}
}

export type CaptureSession=ReturnType<typeof useCaptureSession>
const Context=createContext<CaptureSession|null>(null)
export function CaptureProvider({children}:{children:ReactNode}){
 const session=useCaptureSession()
 return <Context.Provider value={session}>{children}<CaptureIndicator draft={session}/></Context.Provider>
}
export function useCapture(){
 const session=useContext(Context)
 if(!session)throw new Error('CaptureProvider is missing')
 return session
}
