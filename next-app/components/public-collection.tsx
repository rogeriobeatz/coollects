'use client'
import { useCallback,useEffect,useMemo,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import { ArrowRight,ImageIcon,Layers3,Plus,Search,Check,X,Edit3,MoreHorizontal } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,ProfileRow,publicUrlPath,safeColor } from '@/lib/catalog'
import {CollectionMosaic} from './collection-mosaic'
import {CardSkeleton} from './feedback-states'
import { signedImage } from '@/lib/images'
import {CollectibleCard} from './collectible-card'
import {CollectionView} from './collection-view'
import { useAccount } from '@/hooks/use-account'
type VisibleItem=ItemRow&{url:string|null}
export function PublicCollection({id}:{id:string}){
 const {user}=useAccount()
 const fromExplore=useSearchParams().get('origem')==='explorar'
 const itemHref=(itemId:string)=>'/item/'+encodeURIComponent(itemId)+'?voltar=colecao/'+encodeURIComponent(id)+(fromExplore?'&origem=explorar':'')
 const [search,setSearch]=useState(''),[picker,setPicker]=useState(false),[pending,setPending]=useState<string[]>([]),[allItems,setAllItems]=useState<ItemRow[]>([]),[working,setWorking]=useState(false)
 const [collection,setCollection]=useState<CollectionRow|null>(null)
 const [menuItem,setMenuItem]=useState<string|null>(null)
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [items,setItems]=useState<VisibleItem[]>([])
 const [loading,setLoading]=useState(true),[message,setMessage]=useState('')
 const owner=Boolean(user&&collection&&user.id===collection.owner_id)
 const [changingVisibility,setChangingVisibility]=useState(false)
 const [showAddActions,setShowAddActions]=useState(false)
 const refresh=useCallback(()=>{
  const db=getBrowserClient();if(!db){setMessage('Não foi possível abrir esta coleção agora. Tente novamente mais tarde.');setLoading(false);return}
  let active=true
  void (async()=>{
   const {data,error}=await db.from('collections').select('*').eq('id',id).maybeSingle()
   if(error||!data){if(active){setCollection(null);setItems([]);setMessage('Coleção não encontrada ou privada.');setLoading(false)};return}
   const c=data as CollectionRow
   const [p,links]=await Promise.all([db.from('profiles').select('*').eq('id',c.owner_id).maybeSingle(),db.from('collection_items').select('item_id').eq('collection_id',c.id)])
   const ids=(links.data||[]).map(l=>l.item_id)
   let itemRows:VisibleItem[]=[]
   if(ids.length){
    const result=await db.from('items').select('*').in('id',ids)
    const rows=(result.data||[]) as ItemRow[]
    itemRows=await Promise.all(rows.map(async i=>({...i,url:await signedImage(db,i.photo_path)})))
   }
   if(active){setCollection(c);setProfile((p.data||null) as ProfileRow|null);setItems(itemRows);setLoading(false);window.dispatchEvent(new CustomEvent('coollects:page-title',{detail:c.name}))}
  })().catch(()=>{if(active){setLoading(false);setMessage('Não foi possível carregar a coleção.')}})
  return ()=>{active=false}
 },[id])
 useEffect(()=>refresh(),[refresh])
 useEffect(()=>{if(!owner)return;const db=getBrowserClient();if(!db)return;void db.from('items').select('*').eq('owner_id',user!.id).order('created_at',{ascending:false}).then(({data})=>setAllItems((data||[]) as ItemRow[]))},[owner,user?.id,items.length])
 const existing=new Set(items.map(i=>i.id))
 const available=useMemo(()=>allItems.filter(i=>!existing.has(i.id)&&[i.name,i.brand,i.category].join(' ').toLowerCase().includes(search.toLowerCase())),[allItems,items,search])
 const visible=items.filter(i=>[i.name,i.brand,i.category].join(' ').toLowerCase().includes(search.toLowerCase()))
 async function toggleVisibility(){
  if(!collection||!owner||changingVisibility)return
  const db=getBrowserClient();if(!db)return
  setChangingVisibility(true);setMessage('')
  const next=!collection.is_public
  const {error}=await db.from('collections').update({is_public:next}).eq('id',collection.id).eq('owner_id',user!.id)
  if(error)setMessage('Não foi possível atualizar a visibilidade. Tente novamente.')
  else{setCollection({...collection,is_public:next});setMessage(next?'Coleção publicada! Agora ela pode ser encontrada pela comunidade.':'Coleção privada. Apenas você pode vê-la.')}
  setChangingVisibility(false)
 }
 async function addExisting(){if(!collection||!pending.length||working)return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').insert(pending.map(item_id=>({item_id,collection_id:collection.id})));setWorking(false);if(error){setMessage('Não foi possível adicionar os itens. Tente novamente.');return}setPicker(false);setPending([]);setSearch('');setMessage('Itens adicionados à coleção.');refresh()}
 async function unlink(item:ItemRow){if(!collection||working)return;if(!confirm('Remover "'+item.name+'" desta coleção? O item continuará salvo em Meus itens.'))return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').delete().eq('collection_id',collection.id).eq('item_id',item.id);setWorking(false);if(error){setMessage('Não foi possível remover o item desta coleção.');return}setMessage('Item removido da coleção, mas preservado no acervo.');refresh()}
 if(loading)return <CardSkeleton count={2}/>
 if(!collection)return <div className="empty-collection-panel"><h2>Essa coleção não está disponível.</h2><p>{message}</p><Link className="pill-btn" href="/explorar">Explorar coleções</Link></div>
 return <section className="public-collection compact-collection">
 <div className="compact-collection-head">
  <div className="compact-cover"><CollectionMosaic id={collection.id} coverId={collection.cover_item_id}/></div>
  <div className="compact-collection-copy"><h2>{collection.name}</h2>{collection.description&&<p>{collection.description}</p>}{profile&&!owner&&<Link href={publicUrlPath(profile.username)} className="collector-byline">por {profile.display_name}</Link>}</div>
 </div>
 <div className="compact-collection-summary"><span>{items.length} {items.length===1?'item':'itens'} · {collection.category}</span>{owner&&<button type="button" className="compact-visibility-toggle" disabled={changingVisibility} aria-pressed={collection.is_public} onClick={()=>void toggleVisibility()}>{collection.is_public?'Pública · Tornar privada':'Privada · Tornar pública'}</button>}{!owner&&<span>{collection.is_public?'Pública':'Privada'}</span>}</div>
 {owner&&<button type="button" className="ux-primary compact-add-button" onClick={()=>setShowAddActions(true)}><Plus size={19}/> Adicionar item</button>}
 {owner&&showAddActions&&<div className="creation-sheet-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAddActions(false)}}><section className="creation-sheet" role="dialog" aria-modal="true" aria-label="Adicionar à coleção">
  <div className="creation-sheet-head"><h2>Adicionar à coleção</h2><button type="button" aria-label="Fechar" onClick={()=>setShowAddActions(false)}><X size={22}/></button></div>
  <Link href={'/cadastrar?colecao='+encodeURIComponent(id)}><Plus size={22}/> Novo item</Link>
  <button type="button" onClick={()=>{setShowAddActions(false);setPicker(true);setSearch('');setPending([])}}><Layers3 size={22}/> Item existente</button>
 </section></div>}
 {owner&&items.length>=12&&<label className="collection-search"><Search size={18}/><input aria-label="Buscar itens nesta coleção" placeholder="Buscar itens…" value={picker?'':search} onChange={e=>setSearch(e.target.value)} disabled={picker}/></label>}
  {message&&<p role="status" className="status-inline">{message}</p>}
  {visible.length?<CollectionView storageKey="coollects-collection-view" items={visible} renderCard={(i:VisibleItem)=><CollectibleCard key={i.id} item={i} photoUrl={i.url} href={itemHref(i.id)}
 actions={owner?<div className="cc-card-actions"><button type="button" className="cc-more-trigger" aria-label={"Ações de "+i.name} aria-expanded={menuItem===i.id} onClick={()=>setMenuItem(menuItem===i.id?null:i.id)}><MoreHorizontal size={20}/></button>
 {menuItem===i.id&&<div className="cc-more-menu">
 <Link href={"/itens?editar="+encodeURIComponent(i.id)+"&voltar="+encodeURIComponent(id)}><Edit3 size={16}/> Editar item</Link>
 <button type="button" disabled={working} onClick={()=>{setMenuItem(null);void unlink(i)}}><X size={16}/> Remover da coleção</button>
 </div>}</div>:undefined}
 />}/>:<div className="empty-collection-panel">{items.length?'Nenhum item corresponde à busca.':'Esta coleção ainda não tem itens.'}</div>}
  {owner&&picker&&<div className="edit-overlay" role="dialog" aria-modal="true" aria-label="Adicionar itens à coleção"><section className="edit-modal collection-picker"><button className="close-modal" aria-label="Fechar" onClick={()=>{setPicker(false);setSearch('');setPending([])}}><X size={21}/></button><h2>Adicionar itens</h2><p>Selecione itens que já existem no seu acervo.</p><label className="collection-search"><Search size={18}/><input autoFocus aria-label="Buscar no acervo" placeholder="Nome, marca ou categoria" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="picker-options">{available.map(i=><label key={i.id} className="picker-option"><input type="checkbox" checked={pending.includes(i.id)} onChange={e=>setPending(prev=>e.target.checked?[...prev,i.id]:prev.filter(x=>x!==i.id))}/><span><strong>{i.name}</strong><small>{i.brand||i.category}</small></span>{pending.includes(i.id)&&<Check size={17}/>}</label>)}{available.length===0&&<p>Nenhum item disponível para adicionar.</p>}</div><button className="save-item-button" disabled={working||!pending.length} onClick={()=>void addExisting()}>{working?'Adicionando…':'Adicionar '+pending.length+' '+(pending.length===1?'item':'itens')}</button></section></div>}

 </section>
}
