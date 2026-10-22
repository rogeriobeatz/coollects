'use client'
import {useEffect} from 'react'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import {ArrowRight,Camera,Check,Plus,ChevronDown,FolderPlus,ImagePlus,NotebookPen,PencilLine,RotateCcw,ScanLine,Sparkles,X} from 'lucide-react'
import {AuthGate} from './auth-gate'
import {PhoneCaptureGate} from './phone-capture-gate'
import {AnalysisProgress} from './analysis-progress'
import {MAX_ITEM_PHOTOS} from '@/lib/photo-limits'
import {CATEGORIES} from '@/lib/local-catalog'
import {VehicleFields} from './vehicle-fields'
import {QuickCollection} from './quick-collection'
import {useCapture,type DetailKey} from './capture-provider'

const PRIMARY_DETAILS:[DetailKey,string,string][]=[['manufacturer','Montadora','Ex.: Honda'],['series','Série','Ex.: Compact Kings'],['seriesNumber','Número na série','Ex.: 4/10'],['collectionNumber','Numeração geral','Ex.: 105/250']]
const EXTRA_DETAILS:[DetailKey,string,string][]=[['year','Ano da cartela','Somente se impresso'],['scale','Escala','Ex.: 1:64'],['color','Cor','Ex.: Vermelho'],['condition','Condição','Ex.: Lacrado']]
export function ScanWorkspace({aiEnabled=false}:{aiEnabled?:boolean}){return <AuthGate>{userId=><PhoneCaptureGate userId={userId}><Editor userId={userId} aiEnabled={aiEnabled}/></PhoneCaptureGate>}</AuthGate>}

function Editor({userId,aiEnabled}:{userId:string;aiEnabled:boolean}){
 const params=useSearchParams()
 const preferredCollection=params.get('colecao')
 const {galleryRef,cameraRef,notesRef,collectionsRef,photos,preparing,name,setName,brand,setBrand,category,setCategory,details,setDetails,vehicleDetails,setVehicleDetails,notes,setNotes,collectionIds,setCollectionIds,collections,collectionsLoading,collectionsError,setCollectionsError,setCollectionAttempt,creatingCollection,setCreatingCollection,originMissing,analysis,aiFilled,saving,notice,lastSaved,setLastSaved,busy,hasDraft,openDraft,discard,edited,analyze,continueManually,addPhotos,removePhoto,makeMain,openGallery,focusCollections,focusNotes,save,addCollection,userId:sessionOwner}=useCapture()
 useEffect(()=>{openDraft(userId,aiEnabled,preferredCollection)
 // Configure only on page entry/context changes; draft updates stay in the provider.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[userId,aiEnabled,preferredCollection])
 useEffect(()=>{if(notes&&notesRef.current)notesRef.current.open=true},[notesRef])
 if(sessionOwner!==userId)return <p role="status">Preparando seu cadastro…</p>
 const main=photos[0]
 const field=(key:string)=>'field-label'+(aiFilled.has(key)?' is-ai-filled':'')
 const extraFilled=EXTRA_DETAILS.filter(([key])=>details[key]).length
 const canAddMore=photos.length<MAX_ITEM_PHOTOS
 const showProgress=aiEnabled&&busy

 return <section className="scan-workspace">
  {hasDraft&&<div className="capture-resume-note"><p>Você pode navegar pelo app e retomar este cadastro a qualquer momento.</p><button type="button" className="text-btn" disabled={saving||preparing>0} onClick={discard}>Descartar cadastro</button></div>}
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
   <button type="button" onClick={continueManually}><PencilLine size={16}/> Continuar manualmente</button>
  </AnalysisProgress>}

  {analysis.status==='error'&&<div role="alert" className="ai-magic-error">
   <strong>Não conseguimos identificar automaticamente.</strong><p>{analysis.error}</p>
   <div className="ai-error-actions">{main&&<button type="button" onClick={()=>{void analyze(main)}}><RotateCcw size={15}/> Tentar de novo</button>}<button type="button" onClick={continueManually}>Preencher manualmente</button></div>
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

   <fieldset ref={collectionsRef} className="collection-selector"><legend>Adicionar a coleções</legend>
   {collectionsLoading?<p role="status">Carregando suas coleções…</p>:collectionsError?<div role="alert"><p>{collectionsError}</p><button type="button" className="text-btn" onClick={()=>setCollectionAttempt(v=>v+1)}>Tentar novamente</button>{originMissing&&<button type="button" className="text-btn" onClick={()=>setCollectionsError('')}>Continuar sem a coleção de origem</button>}</div>:collections.length
    ?<div className="collection-chips">{collections.map(c=><label key={c.id}><input type="checkbox" checked={collectionIds.includes(c.id)} onChange={e=>setCollectionIds(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name}</label>)}</div>
    :<p>Você ainda não tem coleções.</p>}
    {!collectionsLoading&&!collectionsError&&<button type="button" className="text-btn" onClick={()=>setCreatingCollection(true)}><FolderPlus size={16}/> Criar coleção</button>}
   </fieldset>

   <details ref={notesRef} className="notes-disclosure"><summary>Observações {notes&&<span>preenchida</span>}</summary>
    <label className={field('notes')} htmlFor="item-notes">Observações pessoais (podem ser visíveis em coleções públicas)<textarea id="item-notes" rows={3} maxLength={300} value={notes} onChange={e=>{edited('notes');setNotes(e.target.value)}} placeholder="História, origem, conservação…"/></label>
   </details>

   <button type="button" disabled={saving||preparing>0||busy||collectionsLoading||Boolean(collectionsError)} className="save-item-button" onClick={()=>void save()}><ArrowRight size={22}/> {saving?'Salvando…':busy?'Aguardando a análise…':'Salvar no meu acervo'}</button>
   <button type="button" disabled={saving||preparing>0||busy||collectionsLoading||Boolean(collectionsError)} className="save-another-button" onClick={()=>void save('another')}><Plus size={18}/> Salvar e cadastrar outro</button>
   {notice&&<p role="status" className="scan-notice">{notice}</p>}
  </div>
  {creatingCollection&&<QuickCollection userId={userId} category={category} onClose={()=>setCreatingCollection(false)} onCreated={addCollection}/>}
 </section>
}
