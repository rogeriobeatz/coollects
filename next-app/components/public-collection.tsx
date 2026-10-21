'use client'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import { ArrowRight,Layers3,Plus,Search,Check,X,Edit3,MoreHorizontal,Globe,Lock,UserRound,ChevronDown,Trash2,Share2 } from 'lucide-react'
import { Modal } from './modal'
import { ShareButton } from './share-button'
import { EmptyIllustration } from './empty-illustration'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,ProfileRow,publicUrlPath } from '@/lib/catalog'
import { CollectionCard } from './collection-card'
import { CollectionActionPopover } from './collection-action-popover'
import { signedImages } from '@/lib/images'
import {CollectibleCard} from './collectible-card'
import {CollectionView} from './collection-view'
import { useAccount } from '@/hooks/use-account'
import { FeedbackNotice,type NoticeKind } from './feedback-notice'
import { CollectorAvatar } from './collector-avatar'
import { CardSocialBar,FollowButton,useFollowing,useItemSocial } from './social-interactions'
import {readAll,readChunks} from '@/lib/pagination'
type VisibleItem=ItemRow&{url:string|null}
export function PublicCollection({id}:{id:string}){
 const {user}=useAccount()
 const params=useSearchParams()
 const fromExplore=params.get('origem')==='explorar'
 const shareItemId=params.get('compartilharItem')
 const itemHref=(itemId:string)=>'/item/'+encodeURIComponent(itemId)+'?voltar=colecao/'+encodeURIComponent(id)+(fromExplore?'&origem=explorar':'')
 const [search,setSearch]=useState(''),[picker,setPicker]=useState(false),[pending,setPending]=useState<string[]>([]),[allItems,setAllItems]=useState<ItemRow[]>([]),[working,setWorking]=useState(false)
 const [pickerSearch,setPickerSearch]=useState(''),[acervoLoading,setAcervoLoading]=useState(false),[acervoError,setAcervoError]=useState(false)
 const pickerRef=useRef<HTMLDialogElement>(null)
 const addRef=useRef<HTMLDivElement>(null)
 const [collection,setCollection]=useState<CollectionRow|null>(null)
 const [menuItem,setMenuItem]=useState<string|null>(null)
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [items,setItems]=useState<VisibleItem[]>([])
 const [loading,setLoading]=useState(true),[message,setMessageValue]=useState('')
 const [messageKind,setMessageKind]=useState<NoticeKind>('error')
 function setMessage(value:string,kind:NoticeKind='error'){setMessageValue(value);setMessageKind(kind)}
 const owner=Boolean(user&&collection&&user.id===collection.owner_id)
 const [changingVisibility,setChangingVisibility]=useState(false)
 const [unlinkItem,setUnlinkItem]=useState<ItemRow|null>(null)
 const [privateShare,setPrivateShare]=useState(false)
 const [readError,setReadError]=useState(false),[readAttempt,setReadAttempt]=useState(0)
 const [displayLimit,setDisplayLimit]=useState(48)
 const shareItem=items.find(item=>item.id===shareItemId)
 useEffect(()=>{if(owner&&shareItemId&&shareItem)setPrivateShare(true)},[owner,shareItemId,shareItem?.id])
 const refresh=useCallback(()=>{
  const db=getBrowserClient();if(!db){setMessage('Não foi possível abrir esta coleção agora. Tente novamente mais tarde.');setLoading(false);return}
  let active=true
  setReadError(false)
  void (async()=>{
   const {data,error}=await db.from('collections').select('*').eq('id',id).maybeSingle()
   if(error)throw error
   if(!data){if(active){setCollection(null);setItems([]);setMessage('Coleção não encontrada ou privada.');setLoading(false)};return}
   const c=data as CollectionRow
   const [p,links]=await Promise.all([db.from('profiles').select('*',{count:'exact'}).eq('id',c.owner_id).maybeSingle(),readAll<{item_id:string}>((from,to)=>db.from('collection_items').select('item_id',{count:'exact'}).eq('collection_id',c.id).order('item_id').range(from,to))])
   const ids=links.map(l=>l.item_id)
   let itemRows:VisibleItem[]=[]
   if(ids.length){
    const rows=await readChunks<ItemRow>(ids,chunk=>readAll((from,to)=>db.from('items').select('*',{count:'exact'}).in('id',chunk).order('created_at',{ascending:false}).order('id').range(from,to)))
    rows.sort((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id))
    const cover=rows.find(row=>row.id===c.cover_item_id)
    const signed=await signedImages(db,[...rows.slice(0,48).map(i=>i.photo_path),cover?.photo_path])
    itemRows=rows.map(i=>({...i,url:i.photo_path?signed.get(i.photo_path)??null:null}))
   }
   if(active){setCollection(c);setProfile((p.data||null) as ProfileRow|null);setItems(itemRows);setLoading(false)}
  })().catch(()=>{if(active){setReadError(true);setLoading(false);setMessage('Não foi possível carregar a coleção. Verifique sua conexão e tente novamente.')}})
  return ()=>{active=false}
 },[id,readAttempt])
 useEffect(()=>refresh(),[refresh])
 useEffect(()=>{
  if(!owner||!picker)return
  const db=getBrowserClient();if(!db)return
  let active=true
  setAcervoLoading(true);setAcervoError(false)
  void (async()=>{
   try{
    const rows=await readAll<ItemRow>((from,to)=>db.from('items').select('*',{count:'exact'}).eq('owner_id',user!.id).order('created_at',{ascending:false}).order('id').range(from,to))
    if(active)setAllItems(rows)
   }catch{if(active)setAcervoError(true)}
   finally{if(active)setAcervoLoading(false)}
  })()
  return ()=>{active=false}
 },[owner,user?.id,picker])
 useEffect(()=>{
  if(!picker)return
  const dialog=pickerRef.current
  dialog?.showModal()
  dialog?.querySelector<HTMLInputElement>('input')?.focus()
  return ()=>{dialog?.close();addRef.current?.querySelector('summary')?.focus()}
 },[picker])
 const available=useMemo(()=>{
  const existing=new Set(items.map(item=>item.id))
  return allItems.filter(i=>!existing.has(i.id)&&[i.name,i.brand,i.category].join(' ').toLowerCase().includes(pickerSearch.toLowerCase()))
 },[allItems,items,pickerSearch])
 const {social,status:socialStatus,retry:retryLikes}=useItemSocial(collection?.is_public?items.map(item=>item.id):[])
 const creatorFollowed=useFollowing(owner?null:profile?.id)
 const visible=items.filter(i=>[i.name,i.brand,i.category,...Object.values(i.details||{}).map(String)].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
 async function changeVisibility(next:boolean){
  if(!collection||!owner||changingVisibility||next===collection.is_public)return
  const db=getBrowserClient();if(!db)return
  setChangingVisibility(true);setMessage('')
  try{
   const {data,error}=await db.from('collections').update({is_public:next}).eq('id',collection.id).eq('owner_id',user!.id).select('id').single()
   if(error||!data)throw error||new Error('Coleção não atualizada')
   setCollection({...collection,is_public:next});setMessage(next?'Coleção publicada! Agora ela pode ser encontrada pela comunidade.':'Esta coleção é privada. Itens também vinculados a coleções públicas continuam visíveis.','success')
  }catch{setMessage('Não foi possível atualizar a visibilidade. Tente novamente.')}
  finally{setChangingVisibility(false)}
 }
 function closePicker(){if(working)return;setPicker(false);setPickerSearch('');setPending([])}
 async function addExisting(){if(!collection||!owner||!pending.length||working)return;const db=getBrowserClient();if(!db)return;setWorking(true);try{const {error}=await db.from('collection_items').insert(pending.map(item_id=>({item_id,collection_id:collection.id})));if(error)throw error;setPicker(false);setPending([]);setPickerSearch('');setSearch('');setMessage('Itens adicionados à coleção.','success');refresh()}catch{setMessage('Não foi possível adicionar os itens. Tente novamente.')}finally{setWorking(false)}}
 async function unlink(item:ItemRow){if(!collection||!owner||working)return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').delete().eq('collection_id',collection.id).eq('item_id',item.id);setWorking(false);setUnlinkItem(null);if(error){setMessage('Não foi possível remover o item desta coleção.');return}setMessage('Item removido da coleção, mas preservado no acervo.','success');refresh()}
 const photoKey=visible.slice(0,displayLimit).map(item=>item.photo_path||'').join(',')
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  void signedImages(db,photoKey.split(',').filter(Boolean)).then(urls=>{if(active)setItems(rows=>rows.map(row=>row.photo_path&&urls.has(row.photo_path)?{...row,url:urls.get(row.photo_path)!}:row))})
  return()=>{active=false}
 },[photoKey])
 useEffect(()=>setDisplayLimit(48),[search])
 if(loading)return <div className="empty-collection-panel">Carregando coleção…</div>
 if(!collection)return <div className="empty-collection-panel"><EmptyIllustration kind="unavailable"/><h2>{readError?'Não foi possível abrir a coleção.':'Essa coleção não está disponível.'}</h2><p>{message}</p>{readError&&<button type="button" className="pill-btn" onClick={()=>{setLoading(true);setReadAttempt(v=>v+1)}}>Tentar novamente</button>}<Link className="pill-btn" href="/explorar">Explorar coleções</Link></div>
 const photos=items.filter(item=>item.url).sort((a,b)=>Number(b.id===collection.cover_item_id)-Number(a.id===collection.cover_item_id)).slice(0,2).map(item=>({src:item.url!,name:item.name}))
 const VisibilityIcon=collection.is_public?Globe:Lock
 const searchField=<label className="collection-search"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Buscar itens nesta coleção" placeholder="Buscar itens…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 return <section className="public-collection collection-detail">
  <CollectionCard collection={collection} photos={photos} hero controls={<>
   {owner?<button type="button" role="switch" aria-checked={collection.is_public} aria-label="Coleção pública" className={'visibility-switch'+(collection.is_public?' is-on':'')} disabled={changingVisibility} onClick={()=>void changeVisibility(!collection.is_public)}>
    <span className="visibility-switch-track" aria-hidden="true"><span className="visibility-switch-thumb"><VisibilityIcon size={11}/></span></span>
    <span>{changingVisibility?'Salvando…':collection.is_public?'Pública':'Privada'}</span>
   </button>:<span className="collection-visibility-label"><VisibilityIcon size={14} aria-hidden="true"/>{collection.is_public?'Pública':'Privada'}</span>}
   <div className="collection-hero-icon-actions">
    {collection.is_public
     ?<ShareButton className="collection-hero-icon" path={'/colecao/'+encodeURIComponent(id)} title={collection.name} text={'Veja a coleção “'+collection.name+'”'+(profile?' de '+profile.display_name:'')+' no Coollects'} icon={<Share2 size={18} aria-hidden="true"/>}><span className="visually-hidden">Compartilhar coleção</span></ShareButton>
     :owner&&<button type="button" className="collection-hero-icon" aria-label="Compartilhar coleção" onClick={()=>setPrivateShare(true)}><Share2 size={18}/></button>}
    {profile&&owner&&<Link className="collection-hero-icon" href={publicUrlPath(profile.username)} aria-label={'Ver perfil de '+profile.display_name} title={'Coleção de '+profile.display_name}><UserRound size={18}/></Link>}
    {owner&&<>
     <Link className="collection-hero-icon" href={'/colecoes?editar='+encodeURIComponent(id)} aria-label="Editar coleção" title="Editar coleção"><Edit3 size={18}/></Link>
     <CollectionActionPopover label="Mais opções da coleção" trigger={<MoreHorizontal size={20}/>}>
      <Link className="collection-danger-action" href={'/colecoes?excluir='+encodeURIComponent(id)}><Trash2 size={17}/> Excluir coleção</Link>
     </CollectionActionPopover>
    </>}
   </div>
  </>}/>
  {profile&&!owner&&<div className="collection-owner-row">
   <Link className="item-owner" href={publicUrlPath(profile.username)} aria-label={'Ver perfil de '+(profile.display_name||profile.username)}>
    <CollectorAvatar name={profile.display_name||profile.username} seed={profile.id} size="sm"/>
    <span><strong>{profile.display_name||profile.username}</strong><small>@{profile.username}</small></span>
   </Link>
   <FollowButton profileId={profile.id} name={profile.display_name||profile.username} following={creatorFollowed}/>
  </div>}
  {collection.description.trim()&&<details className="collection-description"><summary>Sobre a coleção <ChevronDown size={15}/></summary><p>{collection.description}</p></details>}
  <div className="collection-items-heading">
   <h2>{items.length} {items.length===1?'item':'itens'}</h2>
   {owner&&<div ref={addRef}><CollectionActionPopover label="Adicionar itens" className={'collection-add-control'+(items.length?'':' collection-add-primary')} trigger={<><Plus size={17}/><span>Adicionar</span></>}>
    <Link href={'/cadastrar?colecao='+encodeURIComponent(id)}><Plus size={17}/> Novo item</Link>
    <button type="button" onClick={()=>{setPicker(true);setPickerSearch('');setPending([])}}><Layers3 size={17}/> Do meu acervo</button>
   </CollectionActionPopover></div>}
  </div>
  {message&&<FeedbackNotice key={message} message={message} kind={messageKind}/>}
  {readError&&<button type="button" className="pill-btn" onClick={()=>setReadAttempt(v=>v+1)}>Tentar novamente</button>}
  {collection.is_public&&socialStatus==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar as curtidas. <button type="button" onClick={retryLikes}>Tentar novamente</button></p>}
  {items.length>0&&<CollectionView compact toolbarStart={searchField} storageKey="coollects-collection-view" items={visible.slice(0,displayLimit)} getItem={i=>({item:i,photoUrl:i.url,href:itemHref(i.id)})} renderCard={(i:VisibleItem)=><CollectibleCard key={i.id} item={i} photoUrl={i.url} href={itemHref(i.id)}
 footer={collection.is_public?<CardSocialBar itemId={i.id} itemName={i.name} ownerId={i.owner_id} social={social.get(i.id)} status={socialStatus}/>:undefined}
 actions={owner?<div className="cc-card-actions"><button type="button" className="cc-more-trigger" aria-label={"Ações de "+i.name} aria-expanded={menuItem===i.id} onClick={()=>setMenuItem(menuItem===i.id?null:i.id)}><MoreHorizontal size={20}/></button>
 {menuItem===i.id&&<div className="cc-more-menu">
 <Link href={"/itens?editar="+encodeURIComponent(i.id)+"&voltar="+encodeURIComponent(id)}><Edit3 size={16}/> Editar item</Link>
 <button type="button" disabled={working} onClick={()=>{setMenuItem(null);setUnlinkItem(i)}}><X size={16}/> Remover da coleção</button>
 </div>}</div>:undefined}
 />}/>}
  {visible.length>displayLimit&&<button type="button" className="load-more" onClick={()=>setDisplayLimit(n=>n+48)}>Mostrar mais itens</button>}
  {!visible.length&&<div className="empty-collection-panel collection-detail-empty">
   <EmptyIllustration kind={items.length?'search':'empty-collection'}/>
   <h2>{items.length?'Nenhum item encontrado':owner?'Sua coleção começa aqui':'Os itens estão chegando'}</h2>
   <p>{items.length?'Experimente outro nome, marca ou categoria.':owner?'Use “Adicionar” para cadastrar um item ou escolher do seu acervo.':'Esta coleção ainda não tem itens.'}</p>
   {items.length>0&&<button type="button" className="pill-btn" onClick={()=>setSearch('')}>Limpar busca</button>}
  </div>}
  {owner&&picker&&<dialog ref={pickerRef} className="collection-picker-dialog" aria-label="Adicionar itens à coleção" onCancel={event=>{event.preventDefault();closePicker()}} onClick={event=>{if(event.target===event.currentTarget)closePicker()}}><section className="edit-modal collection-picker"><button className="close-modal" type="button" aria-label="Fechar" disabled={working} onClick={closePicker}><X size={21}/></button><h2>Do meu acervo</h2><p>Selecione os itens para esta coleção.</p><label className="collection-search"><Search size={18}/><input autoFocus aria-label="Buscar no acervo" placeholder="Nome, marca ou categoria" value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)}/></label>
   {acervoError?<div role="alert"><p>Não foi possível carregar seu acervo.</p><button type="button" className="pill-btn" onClick={closePicker}>Fechar e tentar novamente</button></div>:acervoLoading?<p role="status">Carregando seu acervo…</p>:<div className="picker-options">{available.map(i=><label key={i.id} className="picker-option"><input type="checkbox" disabled={working} checked={pending.includes(i.id)} onChange={e=>setPending(prev=>e.target.checked?[...prev,i.id]:prev.filter(x=>x!==i.id))}/><span><strong>{i.name}</strong><small>{i.brand||i.category}</small></span>{pending.includes(i.id)&&<Check size={17}/>}</label>)}{available.length===0&&<p>{pickerSearch?'Nenhum item corresponde à busca.':'Nenhum item disponível. Você pode cadastrar um novo item.'}</p>}{!pickerSearch&&available.length===0&&<Link className="pill-btn" href={'/cadastrar?colecao='+encodeURIComponent(id)}>Novo item <Plus size={16}/></Link>}</div>}
   {message&&messageKind==='error'&&<p role="alert">{message}</p>}
   <button className="save-item-button" disabled={working||acervoLoading||acervoError||!pending.length} onClick={()=>void addExisting()}>{working?'Adicionando…':'Adicionar '+pending.length+' '+(pending.length===1?'item':'itens')}</button></section></dialog>}
  {unlinkItem&&<Modal label="Remover item da coleção" onClose={()=>setUnlinkItem(null)} busy={working} initialFocus=".pill-btn.secondary">
   <section className="edit-modal"><h2>Remover da coleção?</h2><p>“{unlinkItem.name}” sai desta coleção, mas continua salvo em Meus itens.</p>
    <div className="item-delete-actions"><button type="button" className="pill-btn secondary" disabled={working} onClick={()=>setUnlinkItem(null)}>Cancelar</button><button type="button" className="pill-btn" disabled={working} onClick={()=>void unlink(unlinkItem)}>{working?'Removendo…':'Remover'}</button></div>
   </section>
  </Modal>}
  {privateShare&&owner&&<Modal label="Compartilhar coleção privada" onClose={()=>setPrivateShare(false)} busy={changingVisibility}>
   <section className="edit-modal share-sheet">
    <button type="button" className="close-modal" aria-label="Fechar" disabled={changingVisibility} onClick={()=>setPrivateShare(false)}><X size={20}/></button>
    {collection.is_public?<>
     <h2>Coleção pública!</h2><p>Agora qualquer pessoa com o link pode ver esta coleção e seus itens.</p>
     <ShareButton className="save-item-button" path={shareItem?'/item/'+encodeURIComponent(shareItem.id):'/colecao/'+encodeURIComponent(id)} title={shareItem?.name||collection.name} text={shareItem?'Veja esta peça no Coollects: '+shareItem.name:'Veja a coleção “'+collection.name+'” no Coollects'} label="Compartilhar agora"/>
    </>:<>
     <span className="share-sheet-icon"><Lock size={22}/></span>
     <h2>Esta coleção é privada</h2><p>Para compartilhar, torne a coleção pública. Qualquer pessoa com o link poderá ver os itens dela, mas nunca seu e-mail.</p>
     <button type="button" className="save-item-button" disabled={changingVisibility} onClick={()=>void changeVisibility(true)}><Globe size={18}/> {changingVisibility?'Publicando…':'Tornar pública'}</button>
    </>}
   </section>
  </Modal>}
  <Link href="/explorar" className="collection-discover-link">Descobrir outras coleções <ArrowRight size={16}/></Link>
 </section>
}
