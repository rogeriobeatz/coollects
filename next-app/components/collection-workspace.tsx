'use client'
import {Modal} from './modal'
import { useCallback,useEffect,useRef,useState } from 'react'
import {useRouter,useSearchParams} from 'next/navigation'
import { ArrowRight,Check,ChevronLeft,FolderPlus,Plus,Layers3 } from 'lucide-react'
import { AuthGate } from './auth-gate'
import { CollectionCard } from './collection-card'
import { EmptyIllustration } from './empty-illustration'
import { CollectionEmojiPicker } from './collection-emoji-picker'
import { FeedbackNotice,type NoticeKind } from './feedback-notice'
import { collectionPreviewItems,type CollectionPhoto,type PreviewLink } from '@/lib/collection-previews'
import { isCollectionEmoji } from '@/lib/collection-emoji'
import { CATEGORIES } from '@/lib/local-catalog'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,collectionUrlPath } from '@/lib/catalog'
import { signedImages } from '@/lib/images'
const colors=['#6125BF','#F15700','#FFD94C','#86DAD8','#E998FB','#A4BCFF']
export function CollectionWorkspace(){return <AuthGate>{userId=><Workspace userId={userId}/>}</AuthGate>}
function Workspace({userId}:{userId:string}){
 const router=useRouter()
 const params=useSearchParams()
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [counts,setCounts]=useState<Record<string,number>>({})
 const [previews,setPreviews]=useState<Record<string,CollectionPhoto[]>>({})
 const [loadError,setLoadError]=useState('')
 const [busy,setBusy]=useState(true)
 const [saving,setSaving]=useState(false)
 const [editing,setEditing]=useState(false)
 const [editId,setEditId]=useState<string|null>(null)
 const [step,setStep]=useState(0)
 const [category,setCategory]=useState('Miniaturas')
 const [emoji,setEmoji]=useState('')
 const [name,setName]=useState('')
 const [color,setColor]=useState('#6125BF')
 const [description,setDescription]=useState('')
 const [isPublic,setPublic]=useState(false)
 const [coverItemId,setCoverItemId]=useState<string|null>(null)
 const [coverOptions,setCoverOptions]=useState<ItemRow[]>([])
 const [filter,setFilter]=useState('Todas')
 const [message,setMessageValue]=useState('')
 const [messageKind,setMessageKind]=useState<NoticeKind>('info')
 const [deleting,setDeleting]=useState<CollectionRow|null>(null)
 const [removing,setRemoving]=useState(false)
 const [deleteError,setDeleteError]=useState('')
 const handledAction=useRef('')
 function setMessage(value:string,kind:NoticeKind='error'){setMessageValue(value);setMessageKind(kind)}
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db){setLoadError('Não foi possível carregar suas coleções.');setBusy(false);return}
  setLoadError('')
  try{
   const {data,error}=await db.from('collections').select('*').eq('owner_id',userId).order('created_at',{ascending:false})
   if(error)throw error
   const list=(data||[]) as CollectionRow[]
   const joined=list.length?await db.from('collection_items').select('collection_id,item_id,created_at,items(id,name,photo_path)').in('collection_id',list.map(collection=>collection.id)).order('created_at',{ascending:true}):{data:[],error:null}
   if(joined.error)throw joined.error
   const picked=collectionPreviewItems(list,(joined.data||[]) as unknown as PreviewLink[])
   setCollections(list);setCounts(picked.counts)
   const paths=[...new Set(Object.values(picked.previews).flat().map(item=>item.photo_path).filter((path):path is string=>Boolean(path)))]
   // Cached copies first, then one batch for the rest; never blocks the list.
   const urls=await signedImages(db,paths)
   const gallery:Record<string,CollectionPhoto[]>={}
   for(const [id,items] of Object.entries(picked.previews))gallery[id]=items.flatMap(item=>{
    const src=item.photo_path?urls.get(item.photo_path):null
    return src?[{src,name:item.name}]:[]
   })
   setPreviews(gallery)
  }catch{setLoadError('Não foi possível carregar suas coleções. Tente novamente.')}
  finally{setBusy(false)}
 },[userId])
 useEffect(()=>{void refresh()},[refresh])
 useEffect(()=>{if(params.get('criar')==='1')start() // New-collection deep link from the item picker.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 useEffect(()=>{
  const edit=params.get('editar')
  const remove=params.get('excluir')
  const id=edit||remove
  const action=(edit?'editar:':'excluir:')+id
  if(!id){handledAction.current='';return}
  if(busy||loadError||handledAction.current===action)return
  handledAction.current=action
  const selected=collections.find(c=>c.id===id)
  if(!selected){setMessage('Esta coleção não está disponível para gerenciar.');return}
  if(edit)start(selected)
  else {setDeleteError('');setDeleting(selected)}
 // Resolve contextual actions only once after the owned collections load.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[busy,loadError,collections,params])
 function reset(){setEditing(false);setEditId(null);setStep(0);setCategory('Miniaturas');setEmoji('');setName('');setColor('#6125BF');setDescription('');setPublic(false);setCoverItemId(null);setCoverOptions([])}
 function start(c?:CollectionRow){setMessage('');if(c){setEditId(c.id);setCategory(c.category);setEmoji(c.emoji||'');setName(c.name);setColor(c.color);setDescription(c.description);setPublic(c.is_public);setCoverItemId(c.cover_item_id||null);
   const db=getBrowserClient();if(db)void db.from('collection_items').select('item_id').eq('collection_id',c.id).then(async({data})=>{const ids=(data||[]).map(row=>row.item_id);if(!ids.length){setCoverOptions([]);return}const result=await db.from('items').select('*').in('id',ids);setCoverOptions((result.data||[]) as ItemRow[])})}else reset();setStep(0);setEditing(true)}
 async function save(){
  if(saving)return
  const db=getBrowserClient();if(!db||!name.trim())return
  if(emoji.trim()&&!isCollectionEmoji(emoji)){setStep(2);setMessage('Escolha apenas um emoji para a coleção.');return}
  setSaving(true);setMessage('')
  const values={name:name.trim(),category,emoji:emoji.trim()||null,color,description:description.trim(),is_public:isPublic,cover_item_id:editId?coverItemId:null}
  const back=params.get('voltar')
  const itemId=!editId&&back&&/^item\/[0-9a-f-]{36}$/i.test(back)?back.slice(5):null
  const response=editId
   ?await db.from('collections').update(values).eq('id',editId).eq('owner_id',userId).select('id').single()
   :await db.from('collections').insert({...values,owner_id:userId}).select('id').single()
  if(response.error||!response.data){setSaving(false);setMessage('Não foi possível salvar a coleção. Verifique os dados e tente novamente.');return}
  if(itemId){
   const {error:linkError}=await db.from('collection_items').insert({collection_id:response.data.id,item_id:itemId})
   if(linkError){setSaving(false);setMessage('Coleção criada, mas não foi possível adicionar o item. Abra a coleção e tente novamente.');void refresh();return}
  }
  setSaving(false)
  reset();setFilter('Todas');setMessage('Coleção salva e sincronizada!','success');void refresh()
  if(itemId)router.push('/item/'+encodeURIComponent(itemId))
 }
 async function remove(c:CollectionRow){
  if(removing)return
  const db=getBrowserClient();if(!db)return
  setRemoving(true)
  setDeleteError('')
  try{
   const {data,error}=await db.from('collections').delete().eq('id',c.id).eq('owner_id',userId).select('id')
   if(error||data?.length!==1)throw new Error('Coleção não excluída')
   setMessage('Coleção excluída. Os itens foram preservados.','success')
   setDeleting(null);void refresh()
  }catch{setDeleteError('Não foi possível excluir a coleção. Tente novamente.')}
  finally{setRemoving(false)}
 }
 const visible=collections.filter(c=>filter==='Todas'||c.category===filter)
 const filters=['Todas',...Array.from(new Set(collections.map(c=>c.category)))]
 return <section className="collection-workspace">
  <div className="collection-shelf-toolbar"><div><p className="kicker">SUA ESTANTE</p><strong>{busy?'—':collections.length} {collections.length===1?'coleção':'coleções'}</strong></div><button type="button" className="pill-btn" onClick={()=>start()} aria-label="Criar coleção"><Plus size={18}/> Nova coleção</button></div>
  {message&&<FeedbackNotice key={message} message={message} kind={messageKind}/>}
  {editing?<div className="collection-wizard">
   <div className="wizard-top"><span>{editId?'EDITAR':'CRIAR'} COLEÇÃO</span><span>0{step+1} / 04</span></div><div className="wizard-meter"><span style={{width:(step+1)*25+'%'}}/></div>
   <h2>{['O que vamos colecionar?','Dê um nome a esse universo.','Deixe com a sua cara.','Qual é a história?'][step]}</h2>
   {step===0&&<div className="wizard-categories">{CATEGORIES.map(c=><button type="button" className={'wizard-category '+(category===c.name?'picked':'')} onClick={()=>setCategory(c.name)} key={c.name}><span>{c.emoji}</span>{c.name}{category===c.name&&<Check size={14}/>}</button>)}</div>}
   {step===1&&<label className="field-label">Nome da coleção<input autoFocus maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Meus carrinhos favoritos"/></label>}
   {step===2&&<><div className="swatch-row">{colors.map(s=><button type="button" key={s} className={'swatch '+(color===s?'current':'')} style={{backgroundColor:s}} onClick={()=>setColor(s)} aria-label={'Escolher cor '+s}>{color===s&&<Check size={18}/>}</button>)}</div><label className="field-label custom-color">Ou escolha outra cor<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label><CollectionEmojiPicker value={emoji} category={category} onChange={setEmoji}/></>}
   {step===3&&<><label className="field-label">Descrição (opcional)<textarea rows={4} maxLength={300} value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="public-switch"><input type="checkbox" checked={isPublic} onChange={e=>setPublic(e.target.checked)}/> {isPublic?'Pública':'Privada'} <small>{isPublic?'Outras pessoas podem encontrar esta coleção e ver seus itens.':'Somente você pode ver esta coleção e seus itens.'}</small></label>{editId&&coverOptions.length>0&&<label className="field-label">Capa da coleção<select value={coverItemId||''} onChange={e=>setCoverItemId(e.target.value||null)}><option value="">Automática — primeiro item com foto</option>{coverOptions.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select><small>Escolha um item da coleção para aparecer na capa.</small></label>}</>}
   <div className="wizard-preview"><span className="preview-kicker">PRÉVIA DO CARTÃO</span><CollectionCard className="collection-preview" collection={{name:name||'Minha coleção',category,color,emoji}}/></div>
   <div className="wizard-footer"><button className="text-btn" onClick={()=>step===0?reset():setStep(step-1)}><ChevronLeft size={17}/>{step===0?'Cancelar':'Voltar'}</button><button disabled={saving||(step===1&&!name.trim())||(step===2&&Boolean(emoji.trim())&&!isCollectionEmoji(emoji))} className="pill-btn" onClick={()=>step===3?void save():setStep(step+1)}>{saving?'Salvando...':step===3?'Salvar coleção':'Continuar'} <ArrowRight size={18}/></button></div>
  </div>:<>
   {collections.length>1&&<div className="collection-shelf-filters"><div className="chip-rail" role="group" aria-label="Categorias de coleções">{filters.map(category=><button type="button" className={'chip '+(filter===category?'chip-active':'')} aria-pressed={filter===category} onClick={()=>setFilter(category)} key={category}>{category}</button>)}</div></div>}
   {loadError?<div className="scan-notice" role="alert">{loadError} <button type="button" onClick={()=>{setBusy(true);void refresh()}}>Tentar novamente</button></div>
    :busy?<div className="collection-shelf-loading" role="status">Preparando suas coleções…</div>
    :visible.length?<div className="collection-shelf">{visible.map(c=><CollectionCard key={c.id} showcase collection={c} href={collectionUrlPath(c.id)} photos={previews[c.id]||[]} meta={(counts[c.id]||0)+' '+(counts[c.id]===1?'item':'itens')+' · '+(c.is_public?'Pública':'Privada')}/>)}</div>
    :<div className="empty-collection-panel collection-shelf-empty"><EmptyIllustration kind={collections.length?'search':'shelf'}/><h2>{collections.length?'Outro universo espera por você.':'Dê um lugar às suas paixões.'}</h2><p>{collections.length?'Experimente outra categoria para encontrar suas coleções.':'Crie sua primeira coleção. Suas peças e histórias ganham uma estante só sua.'}</p>{collections.length?<button type="button" className="pill-btn" onClick={()=>setFilter('Todas')}>Ver todas</button>:<button type="button" className="pill-btn" onClick={()=>start()}><FolderPlus size={18}/> Criar coleção</button>}</div>}

  </>}
  {deleting&&<Modal label="Confirmar exclusão da coleção" onClose={()=>setDeleting(null)} busy={removing} returnFocus=".collection-shelf-toolbar button"><section className="edit-modal"><h2>Excluir coleção?</h2><p>Excluir “{deleting.name}”? Essa ação não pode ser desfeita. Os itens continuarão no seu acervo.</p>{deleteError&&<p role="alert" className="scan-notice">{deleteError}</p>}<div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={removing} onClick={()=>setDeleting(null)}>Cancelar</button><button type="button" className="account-delete-button" disabled={removing} onClick={()=>void remove(deleting)}>{removing?"Excluindo…":"Excluir coleção"}</button></div></section></Modal>}
 </section>
}
