'use client'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import { ArrowRight,Layers3,Plus,Search,Check,X,Edit3,MoreHorizontal,Copy,Globe,Lock,UserRound,ChevronDown,Trash2 } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,ProfileRow,publicUrlPath } from '@/lib/catalog'
import { CollectionCard } from './collection-card'
import { CollectionActionPopover } from './collection-action-popover'
import { signedImage } from '@/lib/images'
import {CollectibleCard} from './collectible-card'
import {CollectionView} from './collection-view'
import { useAccount } from '@/hooks/use-account'
import { FeedbackNotice,type NoticeKind } from './feedback-notice'
type VisibleItem=ItemRow&{url:string|null}
export function PublicCollection({id}:{id:string}){
 const {user}=useAccount()
 const fromExplore=useSearchParams().get('origem')==='explorar'
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
 const refresh=useCallback(()=>{
  const db=getBrowserClient();if(!db){setMessage('Não foi possível abrir esta coleção agora. Tente novamente mais tarde.');setLoading(false);return}
  let active=true
  void (async()=>{
   const {data,error}=await db.from('collections').select('*').eq('id',id).maybeSingle()
   if(error||!data){if(active){setCollection(null);setItems([]);setMessage('Coleção não encontrada ou privada.');setLoading(false)};return}
   const c=data as CollectionRow
   const [p,links]=await Promise.all([db.from('profiles').select('*').eq('id',c.owner_id).maybeSingle(),db.from('collection_items').select('item_id').eq('collection_id',c.id)])
   if(links.error)throw links.error
   const ids=(links.data||[]).map(l=>l.item_id)
   let itemRows:VisibleItem[]=[]
   if(ids.length){
    const result=await db.from('items').select('*').in('id',ids)
    if(result.error)throw result.error
    const rows=(result.data||[]) as ItemRow[]
    itemRows=await Promise.all(rows.map(async i=>({...i,url:await signedImage(db,i.photo_path)})))
   }
   if(active){setCollection(c);setProfile((p.data||null) as ProfileRow|null);setItems(itemRows);setLoading(false)}
  })().catch(()=>{if(active){setLoading(false);setMessage('Não foi possível carregar a coleção.')}})
  return ()=>{active=false}
 },[id])
 useEffect(()=>refresh(),[refresh])
 useEffect(()=>{
  if(!owner||!picker)return
  const db=getBrowserClient();if(!db)return
  let active=true
  setAcervoLoading(true);setAcervoError(false)
  void (async()=>{
   try{
    const {data,error}=await db.from('items').select('*').eq('owner_id',user!.id).order('created_at',{ascending:false})
    if(error)throw error
    if(active)setAllItems((data||[]) as ItemRow[])
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
 async function copyCollectionLink(){
  if(!collection?.is_public)return
  try{await navigator.clipboard.writeText(window.location.origin+'/colecao/'+encodeURIComponent(id));setMessage('Link da coleção copiado!','success')}
  catch{setMessage('Não foi possível copiar o link. Copie o endereço do navegador.')}
 }
 const available=useMemo(()=>{
  const existing=new Set(items.map(item=>item.id))
  return allItems.filter(i=>!existing.has(i.id)&&[i.name,i.brand,i.category].join(' ').toLowerCase().includes(pickerSearch.toLowerCase()))
 },[allItems,items,pickerSearch])
 const visible=items.filter(i=>[i.name,i.brand,i.category,...Object.values(i.details||{}).map(String)].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
 async function changeVisibility(next:boolean){
  if(!collection||!owner||changingVisibility||next===collection.is_public)return
  const db=getBrowserClient();if(!db)return
  setChangingVisibility(true);setMessage('')
  try{
   const {data,error}=await db.from('collections').update({is_public:next}).eq('id',collection.id).eq('owner_id',user!.id).select('id').single()
   if(error||!data)throw error||new Error('Coleção não atualizada')
   setCollection({...collection,is_public:next});setMessage(next?'Coleção publicada! Agora ela pode ser encontrada pela comunidade.':'Coleção privada. Apenas você pode vê-la.','success')
  }catch{setMessage('Não foi possível atualizar a visibilidade. Tente novamente.')}
  finally{setChangingVisibility(false)}
 }
 function closePicker(){if(working)return;setPicker(false);setPickerSearch('');setPending([])}
 async function addExisting(){if(!collection||!owner||!pending.length||working)return;const db=getBrowserClient();if(!db)return;setWorking(true);try{const {error}=await db.from('collection_items').insert(pending.map(item_id=>({item_id,collection_id:collection.id})));if(error)throw error;setPicker(false);setPending([]);setPickerSearch('');setSearch('');setMessage('Itens adicionados à coleção.','success');refresh()}catch{setMessage('Não foi possível adicionar os itens. Tente novamente.')}finally{setWorking(false)}}
 async function unlink(item:ItemRow){if(!collection||!owner||working)return;if(!confirm('Remover "'+item.name+'" desta coleção? O item continuará salvo em Meus itens.'))return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').delete().eq('collection_id',collection.id).eq('item_id',item.id);setWorking(false);if(error){setMessage('Não foi possível remover o item desta coleção.');return}setMessage('Item removido da coleção, mas preservado no acervo.','success');refresh()}
 if(loading)return <div className="empty-collection-panel">Carregando coleção…</div>
 if(!collection)return <div className="empty-collection-panel"><h2>Essa coleção não está disponível.</h2><p>{message}</p><Link className="pill-btn" href="/explorar">Explorar coleções</Link></div>
 const photos=items.filter(item=>item.url).sort((a,b)=>Number(b.id===collection.cover_item_id)-Number(a.id===collection.cover_item_id)).slice(0,2).map(item=>({src:item.url!,name:item.name}))
 const VisibilityIcon=collection.is_public?Globe:Lock
 const searchField=<label className="collection-search"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Buscar itens nesta coleção" placeholder="Buscar itens…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 return <section className="public-collection collection-detail">
  <CollectionCard collection={collection} photos={photos} hero controls={<>
   {owner?<CollectionActionPopover label="Visibilidade da coleção" className="collection-visibility-control" trigger={<><VisibilityIcon size={15} aria-hidden="true"/><span>{changingVisibility?'Salvando…':collection.is_public?'Pública':'Privada'}</span><ChevronDown size={12} aria-hidden="true"/></>}>
    <button type="button" aria-pressed={!collection.is_public} disabled={changingVisibility} onClick={()=>void changeVisibility(false)}><Lock size={17}/> Privada{!collection.is_public&&<Check size={15}/>}</button>
    <button type="button" aria-pressed={collection.is_public} disabled={changingVisibility} onClick={()=>void changeVisibility(true)}><Globe size={17}/> Pública{collection.is_public&&<Check size={15}/>}</button>
   </CollectionActionPopover>:<span className="collection-visibility-label"><VisibilityIcon size={14} aria-hidden="true"/>{collection.is_public?'Pública':'Privada'}</span>}
   <div className="collection-hero-icon-actions">
    {profile&&<Link className="collection-hero-icon" href={publicUrlPath(profile.username)} aria-label={'Ver perfil de '+profile.display_name} title={'Coleção de '+profile.display_name}><UserRound size={18}/></Link>}
    {owner&&<>
     <Link className="collection-hero-icon" href={'/colecoes?editar='+encodeURIComponent(id)} aria-label="Editar coleção" title="Editar coleção"><Edit3 size={18}/></Link>
     <CollectionActionPopover label="Mais opções da coleção" trigger={<MoreHorizontal size={20}/>}>
      {collection.is_public&&<button type="button" onClick={()=>void copyCollectionLink()}><Copy size={17}/> Copiar link</button>}
      <Link className="collection-danger-action" href={'/colecoes?excluir='+encodeURIComponent(id)}><Trash2 size={17}/> Excluir coleção</Link>
     </CollectionActionPopover>
    </>}
   </div>
  </>}/>
  {collection.description.trim()&&<details className="collection-description"><summary>Sobre a coleção <ChevronDown size={15}/></summary><p>{collection.description}</p></details>}
  <div className="collection-items-heading">
   <h2>{items.length} {items.length===1?'item':'itens'}</h2>
   {owner&&<div ref={addRef}><CollectionActionPopover label="Adicionar itens" className={'collection-add-control'+(items.length?'':' collection-add-primary')} trigger={<><Plus size={17}/><span>Adicionar</span></>}>
    <Link href={'/cadastrar?colecao='+encodeURIComponent(id)}><Plus size={17}/> Novo item</Link>
    <button type="button" onClick={()=>{setPicker(true);setPickerSearch('');setPending([])}}><Layers3 size={17}/> Do meu acervo</button>
   </CollectionActionPopover></div>}
  </div>
  {message&&<FeedbackNotice key={message} message={message} kind={messageKind}/>}
  {items.length>0&&<CollectionView compact toolbarStart={searchField} storageKey="coollects-collection-view" items={visible} getItem={i=>({item:i,photoUrl:i.url,href:itemHref(i.id)})} renderCard={(i:VisibleItem)=><CollectibleCard key={i.id} item={i} photoUrl={i.url} href={itemHref(i.id)}
 actions={owner?<div className="cc-card-actions"><button type="button" className="cc-more-trigger" aria-label={"Ações de "+i.name} aria-expanded={menuItem===i.id} onClick={()=>setMenuItem(menuItem===i.id?null:i.id)}><MoreHorizontal size={20}/></button>
 {menuItem===i.id&&<div className="cc-more-menu">
 <Link href={"/itens?editar="+encodeURIComponent(i.id)+"&voltar="+encodeURIComponent(id)}><Edit3 size={16}/> Editar item</Link>
 <button type="button" disabled={working} onClick={()=>{setMenuItem(null);void unlink(i)}}><X size={16}/> Remover da coleção</button>
 </div>}</div>:undefined}
 />}/>}
  {!visible.length&&<div className="empty-collection-panel collection-detail-empty">
   <Layers3 size={28} aria-hidden="true"/>
   <h2>{items.length?'Nenhum item encontrado':owner?'Sua coleção começa aqui':'Os itens estão chegando'}</h2>
   <p>{items.length?'Experimente outro nome, marca ou categoria.':owner?'Use “Adicionar” para cadastrar um item ou escolher do seu acervo.':'Esta coleção ainda não tem itens.'}</p>
   {items.length>0&&<button type="button" className="pill-btn" onClick={()=>setSearch('')}>Limpar busca</button>}
  </div>}
  {owner&&picker&&<dialog ref={pickerRef} className="collection-picker-dialog" aria-label="Adicionar itens à coleção" onCancel={event=>{event.preventDefault();closePicker()}} onClick={event=>{if(event.target===event.currentTarget)closePicker()}}><section className="edit-modal collection-picker"><button className="close-modal" type="button" aria-label="Fechar" disabled={working} onClick={closePicker}><X size={21}/></button><h2>Do meu acervo</h2><p>Selecione os itens para esta coleção.</p><label className="collection-search"><Search size={18}/><input autoFocus aria-label="Buscar no acervo" placeholder="Nome, marca ou categoria" value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)}/></label>
   {acervoError?<div role="alert"><p>Não foi possível carregar seu acervo.</p><button type="button" className="pill-btn" onClick={closePicker}>Fechar e tentar novamente</button></div>:acervoLoading?<p role="status">Carregando seu acervo…</p>:<div className="picker-options">{available.map(i=><label key={i.id} className="picker-option"><input type="checkbox" disabled={working} checked={pending.includes(i.id)} onChange={e=>setPending(prev=>e.target.checked?[...prev,i.id]:prev.filter(x=>x!==i.id))}/><span><strong>{i.name}</strong><small>{i.brand||i.category}</small></span>{pending.includes(i.id)&&<Check size={17}/>}</label>)}{available.length===0&&<p>{pickerSearch?'Nenhum item corresponde à busca.':'Nenhum item disponível. Você pode cadastrar um novo item.'}</p>}{!pickerSearch&&available.length===0&&<Link className="pill-btn" href={'/cadastrar?colecao='+encodeURIComponent(id)}>Novo item <Plus size={16}/></Link>}</div>}
   {message&&messageKind==='error'&&<p role="alert">{message}</p>}
   <button className="save-item-button" disabled={working||acervoLoading||acervoError||!pending.length} onClick={()=>void addExisting()}>{working?'Adicionando…':'Adicionar '+pending.length+' '+(pending.length===1?'item':'itens')}</button></section></dialog>}
  <Link href="/explorar" className="collection-discover-link">Descobrir outras coleções <ArrowRight size={16}/></Link>
 </section>
}
