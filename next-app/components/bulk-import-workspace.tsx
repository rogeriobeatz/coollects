'use client'
import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import Link from 'next/link'
import {Check,Clock3,ImagePlus,LoaderCircle,RefreshCw,Sparkles,UploadCloud} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {getBrowserClient} from '@/lib/supabase/client'
import {BUCKET} from '@/lib/catalog'
import {preparePhoto} from '@/lib/photo-preparation'
import {uploadImage} from '@/lib/images'
import {CATEGORIES} from '@/lib/local-catalog'

type Suggestion={name:string;brand:string;category:string;notes:string;visibleText:string;confidence:'low'|'medium'|'high';details?:Record<string,unknown>}
type ImportItem={id:string;photo_path:string;status:'queued'|'processing'|'ready'|'failed'|'saved';suggestion:Suggestion|null;error_message:string|null;attempts:number}
type Job={id:string;status:string;total_count:number}
type Counts={queued:number;processing:number;ready:number;failed:number;saved:number}
const STORAGE_KEY='coollects:bulk-import-job'
const emptyCounts:Counts={queued:0,processing:0,ready:0,failed:0,saved:0}
const inputStyle={width:'100%',padding:'12px',border:'1px solid var(--line,#ddd)',borderRadius:12,background:'var(--surface,#fff)',color:'inherit',font:'inherit'} as const

export function BulkImportWorkspace(){
 const {user,loading}=useAccount()
 const [files,setFiles]=useState<File[]>([])
 const [preparing,setPreparing]=useState(false)
 const [uploading,setUploading]=useState(false)
 const [error,setError]=useState('')
 const [job,setJob]=useState<Job|null>(null)
 const [items,setItems]=useState<ImportItem[]>([])
 const [counts,setCounts]=useState<Counts>(emptyCounts)
 const [collections,setCollections]=useState<{id:string;name:string}[]>([])
 const [collectionId,setCollectionId]=useState('')
 const [savingId,setSavingId]=useState<string|null>(null)
 const [edits,setEdits]=useState<Record<string,Partial<Suggestion>>>({})
 const [polling,setPolling]=useState(false)
 const [photoUrls,setPhotoUrls]=useState<Record<string,string>>({})
 const previewUrls=useMemo(()=>files.map(file=>URL.createObjectURL(file)),[files])
 const picker=useRef<HTMLInputElement>(null)
 const client=getBrowserClient()
 const active=Boolean(job&&['queued','processing'].includes(job.status))
 const completed=counts.ready+counts.failed+counts.saved
 const percent=job?Math.round((completed/job.total_count)*100):0

 useEffect(()=>()=>previewUrls.forEach(url=>URL.revokeObjectURL(url)),[previewUrls])

 useEffect(()=>{if(!user||!client)return;let live=true;void client.from('collections').select('id,name').eq('owner_id',user.id).order('created_at').then(({data})=>{if(live)setCollections(data||[])})
  const stored=window.localStorage.getItem(STORAGE_KEY)
  if(stored)void refresh(stored)
  return()=>{live=false}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user?.id])

 useEffect(()=>{if(!client||!items.length)return;let live=true;const paths=items.map(x=>x.photo_path);void client.storage.from(BUCKET).createSignedUrls(paths,3600).then(({data})=>{if(!live)return;const next:Record<string,string>={};for(const entry of data||[])if(entry.path&&entry.signedUrl)next[entry.path]=entry.signedUrl;setPhotoUrls(next)});return()=>{live=false}},[items,client])

 const refresh=useCallback(async(id:string)=>{
  setPolling(true)
  try{
   const response=await fetch('/api/bulk-import?jobId='+encodeURIComponent(id),{cache:'no-store'})
   const data=await response.json()
   if(!response.ok)throw new Error(data.error||'Não foi possível carregar a importação.')
   setJob(data.job);setItems(data.items||[]);setCounts(data.counts||emptyCounts)
   if(['review','partial','completed','failed'].includes(data.job.status))window.localStorage.setItem(STORAGE_KEY,id)
  }catch(e){setError(e instanceof Error?e.message:'Falha ao atualizar a importação.')}
  finally{setPolling(false)}
 },[])
 useEffect(()=>{if(!job?.id||!active)return;const timer=window.setInterval(()=>void refresh(job.id),7000);return()=>window.clearInterval(timer)},[job?.id,active,refresh])

 const chooseFiles=async(list:FileList|null)=>{
  if(!list)return
  setError('')
  const next=Array.from(list)
  if(files.length+next.length>100){setError('O limite é de 100 fotos por importação.');return}
  setPreparing(true)
  const prepared:File[]=[];const failures:string[]=[]
  for(const file of next){try{prepared.push((await preparePhoto(file)).file)}catch(e){failures.push(file.name+': '+(e instanceof Error?e.message:'não foi possível preparar a foto.'))}}
  setFiles(v=>[...v,...prepared]);setPreparing(false)
  if(failures.length)setError(failures.slice(0,3).join(' · ')+(failures.length>3?' · e mais '+(failures.length-3)+' arquivo(s).':''))
  if(picker.current)picker.current.value=''
 }
 const start=async()=>{
  if(!user||!client||!files.length)return
  setUploading(true);setError('')
  const paths:string[]=[]
  try{
   // Upload in small groups to avoid exhausting mobile memory/network sockets.
   for(let i=0;i<files.length;i+=3){
    const batch=await Promise.all(files.slice(i,i+3).map(file=>uploadImage(client,user.id,file)))
    paths.push(...batch)
   }
   const response=await fetch('/api/bulk-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photoPaths:paths})})
   const data=await response.json()
   if(!response.ok||!data.jobId){
    const diagnostic=data.diagnosticId?' (diagnóstico '+data.diagnosticId+')':''
    throw new Error((data.error||'Não foi possível iniciar a fila.')+diagnostic+(data.code?' · código '+data.code:''))
   }
   window.localStorage.setItem(STORAGE_KEY,data.jobId)
   setJob({id:data.jobId,status:'queued',total_count:paths.length});setFiles([])
   await refresh(data.jobId)
  }catch(e){
   if(paths.length)await client.storage.from(BUCKET).remove(paths).catch(()=>{})
   setError(e instanceof Error?e.message:'Não foi possível iniciar a importação.')
  }finally{setUploading(false)}
 }
 const update=(id:string,key:keyof Suggestion,value:string)=>{
  setEdits(v=>({...v,[id]:{...(v[id]||{}),[key]:value}}))
 }
 const updateDetail=(id:string,key:string,value:string)=>{
  setEdits(v=>({...v,[id]:{...(v[id]||{}),details:{...((v[id]?.details||items.find(x=>x.id===id)?.suggestion?.details)||{}),[key]:value}}}))
 }
 const saveOne=async(item:ImportItem)=>{
  if(!client||!item.suggestion||!job)return
  const s={...item.suggestion,...edits[item.id]}
  if(!s.name?.trim()){setError('Informe o nome do item antes de salvar.');return}
  setSavingId(item.id);setError('')
  const {data,error:saveError}=await client.rpc('save_bulk_import_item',{p_bulk_item_id:item.id,p_name:s.name.trim(),p_brand:(s.brand||'').trim(),p_category:s.category||'Miniaturas',p_notes:(s.notes||'').trim(),p_collection_ids:collectionId?[collectionId]:[],p_details:s.category==='Miniaturas'?(s.details||{}):{}})
  if(saveError||!data){setError('Não foi possível salvar “'+s.name+'”. O item continua na revisão para tentar novamente.');setSavingId(null);return}
  setItems(v=>v.map(x=>x.id===item.id?{...x,status:'saved'}:x))
  setCounts(v=>({...v,ready:Math.max(0,v.ready-1),saved:v.saved+1}))
  setSavingId(null)
 }
 const retry=async()=>{
  if(!job||!client)return
  const failed=items.filter(item=>item.status==='failed')
  if(!failed.length)return
  setError('');setPolling(true)
  try{
   for(const item of failed){
    const {error:retryError}=await client.rpc('retry_bulk_import_item',{p_item_id:item.id})
    if(retryError)throw retryError
   }
   await refresh(job.id)
  }catch{
   setError('Não foi possível retomar todos os itens. Atualize a importação e tente novamente.')
  }finally{setPolling(false)}
 }
 const readyItems=items.filter(x=>x.status==='ready')
 const queuedCount=counts.queued+counts.processing
 if(loading)return <p role="status">Carregando sua conta…</p>
 if(!user)return <p>Entre na sua conta para importar fotos. <Link href="/entrar">Entrar</Link></p>

 return <section className="bulk-import" style={{display:'grid',gap:18,paddingBottom:32}}>
  {!job&&<><div style={{border:'1px solid var(--line,#ddd)',borderRadius:18,padding:18,background:'var(--surface,#fff)'}}>
   <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><Sparkles size={20}/><strong>Uma foto = um item</strong></div>
   <p style={{margin:'0 0 14px',opacity:.78}}>Selecione até 100 fotos da sua galeria. O Coollects prepara cada imagem, envia para a fila e reconhece os itens em segundo plano.</p>
   <button type="button" onClick={()=>picker.current?.click()} disabled={preparing||uploading} style={{...inputStyle,display:'flex',alignItems:'center',justifyContent:'center',gap:10,cursor:'pointer',fontWeight:700}}><ImagePlus size={20}/> Selecionar fotos</button>
   <input ref={picker} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={e=>void chooseFiles(e.target.files)}/>
   <p style={{fontSize:13,opacity:.65,marginBottom:0}}>Máximo de 100 fotos por lote. Cada foto é reduzida para até 600 KB.</p>
  </div>
  {preparing&&<p role="status"><LoaderCircle size={16}/> Preparando fotos…</p>}
  {files.length>0&&<><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong>{files.length} foto(s) selecionada(s)</strong><button type="button" onClick={()=>setFiles([])} style={{background:'none',border:0,color:'inherit'}}>Limpar</button></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:7}}>{files.slice(0,16).map((f,i)=><div key={i} style={{aspectRatio:'1',position:'relative',borderRadius:10,background:'#8882',display:'grid',placeItems:'center',fontSize:12,overflow:'hidden'}}><img src={previewUrls[i]} alt={'Prévia da foto '+(i+1)} style={{width:'100%',height:'100%',objectFit:'cover'}}/><span style={{position:'absolute',alignSelf:'end',justifySelf:'start',background:'#111b',color:'#fff',padding:'3px 6px',borderRadius:6}}>{i+1}</span></div>)}</div>
   {files.length>16&&<p style={{margin:0,opacity:.7}}>+ {files.length-16} fotos</p>}
   <button type="button" disabled={uploading||preparing} onClick={()=>void start()} style={{...inputStyle,background:'#6125BF',color:'#fff',border:0,fontWeight:800,display:'flex',justifyContent:'center',gap:10,alignItems:'center'}}>{uploading?<><LoaderCircle size={18}/> Enviando fotos…</>:<><UploadCloud size={18}/> Iniciar importação de {files.length} itens</>}</button>
  </>}</>}

  {job&&<><div style={{border:'1px solid var(--line,#ddd)',borderRadius:18,padding:18}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}><strong>Importação em andamento</strong><button type="button" onClick={()=>void refresh(job.id)} disabled={polling} style={{border:0,background:'none',color:'inherit'}}><RefreshCw size={18}/></button></div>
   <p style={{fontSize:13,opacity:.7}}>Você pode fechar o aplicativo. A fila continua processando no servidor.</p>
   <div style={{height:9,borderRadius:20,background:'#8883',overflow:'hidden'}}><div style={{height:'100%',width:percent+'%',background:'#6125BF',transition:'width .3s'}}/></div>
   <p style={{marginBottom:0,fontWeight:700}}>{completed} de {job.total_count} processados ({percent}%)</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:12,fontSize:12,marginTop:12,opacity:.8}}><span>Na fila: {queuedCount}</span><span>Para revisar: {counts.ready}</span><span>Falhas: {counts.failed}</span><span>Salvos: {counts.saved}</span></div>
   {active&&<p style={{display:'flex',alignItems:'center',gap:7,fontSize:13,marginBottom:0}}><Clock3 size={15}/> Processamento automático, normalmente em alguns minutos.</p>}
   {counts.failed>0&&<button type="button" disabled={polling} onClick={()=>void retry()} style={{...inputStyle,background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><RefreshCw size={16}/> Tentar novamente {counts.failed} foto(s) com falha</button>}
  </div>
  {items.length>0&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{fontSize:20,margin:0}}>Revisar itens</h2><span style={{fontSize:13,opacity:.7}}>{readyItems.length} aguardando revisão</span></div>}
  {items.map((item,index)=>{
   const s=item.suggestion
   return <article key={item.id} style={{border:'1px solid var(--line,#ddd)',borderRadius:16,padding:14,display:'grid',gap:10,opacity:item.status==='saved'?.65:1}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong>Foto {index+1}</strong><span style={{fontSize:12,fontWeight:700}}>{item.status==='ready'?'Pronto para revisar':item.status==='saved'?'Salvo':item.status==='failed'?'Falhou':item.status==='processing'?'Analisando':'Na fila'}</span></div>
    {photoUrls[item.photo_path]&&<img src={photoUrls[item.photo_path]} alt={'Foto '+(index+1)+' do item'} style={{width:'100%',maxHeight:210,objectFit:'contain',borderRadius:10,background:'#8882'}}/>}
    {s&&item.status==='ready'&&<><label style={{display:'grid',gap:5,fontSize:13}}>Nome *<input style={inputStyle} value={edits[item.id]?.name??s.name} onChange={e=>update(item.id,'name',e.target.value)}/></label>
     <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><label style={{display:'grid',gap:5,fontSize:13}}>Marca<input style={inputStyle} value={edits[item.id]?.brand??s.brand} onChange={e=>update(item.id,'brand',e.target.value)}/></label><label style={{display:'grid',gap:5,fontSize:13}}>Categoria<select style={inputStyle} value={edits[item.id]?.category??s.category} onChange={e=>update(item.id,'category',e.target.value)}>{CATEGORIES.map(c=><option key={c.name}>{c.name}</option>)}</select></label></div>
     <label style={{display:'grid',gap:5,fontSize:13}}>Observações<input style={inputStyle} value={edits[item.id]?.notes??s.notes} onChange={e=>update(item.id,'notes',e.target.value)}/></label>
     {(edits[item.id]?.category??s.category)==='Miniaturas'&&<details><summary style={{cursor:'pointer',fontSize:13,padding:'8px 0'}}>Detalhes da miniatura</summary><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>{[['manufacturer','Montadora'],['series','Série'],['seriesNumber','Número na série'],['collectionNumber','Numeração geral'],['year','Ano'],['scale','Escala'],['color','Cor'],['condition','Condição']].map(([key,label])=><label key={key} style={{display:'grid',gap:4,fontSize:12}}>{label}<input style={inputStyle} value={String((edits[item.id]?.details||s.details||{})[key]??'')} onChange={e=>updateDetail(item.id,key,e.target.value)}/></label>)}</div></details>}
     <p style={{fontSize:12,opacity:.65,margin:0}}>Confiança da IA: {s.confidence==='high'?'alta':s.confidence==='medium'?'média':'baixa'} · confira os dados antes de salvar.</p>
     <button type="button" disabled={Boolean(savingId)} onClick={()=>void saveOne(item)} style={{...inputStyle,background:'#6125BF',color:'#fff',border:0,fontWeight:700}}>{savingId===item.id?'Salvando…':'Salvar este item'}</button>
    </>}
    {item.status==='failed'&&<p style={{fontSize:13,margin:0,opacity:.75}}>{item.error_message||'Não foi possível reconhecer esta foto.'}</p>}
    {item.status==='saved'&&<p style={{display:'flex',alignItems:'center',gap:6,margin:0,fontSize:13}}><Check size={15}/> Item salvo no seu acervo.</p>}
    {['queued','processing'].includes(item.status)&&<p style={{fontSize:13,margin:0,opacity:.7}}>{item.status==='processing'?'A IA está analisando esta foto…':'Aguardando processamento…'}</p>}
   </article>
  })}
  {readyItems.length>0&&<label style={{display:'grid',gap:6,fontSize:13}}>Adicionar itens à coleção<select style={inputStyle} value={collectionId} onChange={e=>setCollectionId(e.target.value)}><option value="">Não adicionar a uma coleção</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
  {counts.saved===job.total_count&&<p role="status" style={{display:'flex',alignItems:'center',gap:8,fontWeight:700}}><Check/> Importação concluída! Todos os itens foram salvos.</p>}
  <button type="button" onClick={()=>{setJob(null);setItems([]);setCounts(emptyCounts);window.localStorage.removeItem(STORAGE_KEY)}} style={{...inputStyle,background:'transparent'}}>Iniciar outro lote</button>
  </>}
  {error&&<p role="alert" style={{color:'#c33',margin:0}}>{error}</p>}
 </section>
}
