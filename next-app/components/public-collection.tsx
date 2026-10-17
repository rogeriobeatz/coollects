'use client'
import { useCallback,useEffect,useMemo,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,Layers3,Plus,Search,Check,X,Edit3 } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,ProfileRow,publicUrlPath,safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
import { signedImage } from '@/lib/images'
import { useAccount } from '@/hooks/use-account'
type VisibleItem=ItemRow&{url:string|null}
export function PublicCollection({id}:{id:string}){
 const {user}=useAccount()
 const [search,setSearch]=useState(''),[picker,setPicker]=useState(false),[pending,setPending]=useState<string[]>([]),[allItems,setAllItems]=useState<ItemRow[]>([]),[working,setWorking]=useState(false)
 const [collection,setCollection]=useState<CollectionRow|null>(null)
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [items,setItems]=useState<VisibleItem[]>([])
 const [loading,setLoading]=useState(true),[message,setMessage]=useState('')
 const owner=Boolean(user&&collection&&user.id===collection.owner_id)
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
   if(active){setCollection(c);setProfile((p.data||null) as ProfileRow|null);setItems(itemRows);setLoading(false)}
  })().catch(()=>{if(active){setLoading(false);setMessage('Não foi possível carregar a coleção.')}})
  return ()=>{active=false}
 },[id])
 useEffect(()=>refresh(),[refresh])
 useEffect(()=>{if(!owner)return;const db=getBrowserClient();if(!db)return;void db.from('items').select('*').eq('owner_id',user!.id).order('created_at',{ascending:false}).then(({data})=>setAllItems((data||[]) as ItemRow[]))},[owner,user?.id,items.length])
 const existing=new Set(items.map(i=>i.id))
 const available=useMemo(()=>allItems.filter(i=>!existing.has(i.id)&&[i.name,i.brand,i.category].join(' ').toLowerCase().includes(search.toLowerCase())),[allItems,items,search])
 const visible=items.filter(i=>[i.name,i.brand,i.category].join(' ').toLowerCase().includes(search.toLowerCase()))
 async function addExisting(){if(!collection||!pending.length||working)return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').insert(pending.map(item_id=>({item_id,collection_id:collection.id})));setWorking(false);if(error){setMessage('Não foi possível adicionar os itens. Tente novamente.');return}setPicker(false);setPending([]);setSearch('');setMessage('Itens adicionados à coleção.');refresh()}
 async function unlink(item:ItemRow){if(!collection||working)return;if(!confirm('Remover "'+item.name+'" desta coleção? O item continuará salvo em Meus itens.'))return;const db=getBrowserClient();if(!db)return;setWorking(true);const {error}=await db.from('collection_items').delete().eq('collection_id',collection.id).eq('item_id',item.id);setWorking(false);if(error){setMessage('Não foi possível remover o item desta coleção.');return}setMessage('Item removido da coleção, mas preservado no acervo.');refresh()}
 if(loading)return <div className="empty-collection-panel">Carregando coleção…</div>
 if(!collection)return <div className="empty-collection-panel"><h2>Essa coleção não está disponível.</h2><p>{message}</p><Link className="pill-btn" href="/explorar">Explorar coleções</Link></div>
 return <section className="public-collection"><div className="public-cover" style={{'--poster-accent':safeColor(collection.color)} as CSSProperties}><CategoryArt category={collection.category}/><span>{collection.category}</span></div>
  <h2>{collection.name}</h2><p>{collection.description||'Uma coleção para compartilhar.'}</p>
  {profile&&<Link href={publicUrlPath(profile.username)} className="collector-byline">por <strong>{profile.display_name}</strong><ArrowRight size={15}/></Link>}
  {owner&&<div className="collection-actions"><Link className="pill-btn" href={'/cadastrar?colecao='+encodeURIComponent(id)}><Plus size={18}/> Cadastrar novo</Link><button className="pill-btn secondary" type="button" onClick={()=>{setPicker(true);setSearch('');setPending([])}}><Layers3 size={18}/> Adicionar existente</button></div>}
  <div className="section-title-inline"><div><p className="kicker">OLHE DE PERTO</p><h2>{items.length} {items.length===1?'item':'itens'}</h2></div><Layers3 size={24}/></div>
  {owner&&<label className="collection-search"><Search size={18}/><input aria-label="Buscar itens nesta coleção" placeholder="Buscar nesta coleção…" value={picker?'':search} onChange={e=>setSearch(e.target.value)} disabled={picker}/></label>}
  {message&&<p role="status" className="status-inline">{message}</p>}
  {visible.length?<div className="public-item-list">{visible.map(i=><div className="item-row" key={i.id}>{i.url?<img src={i.url} className="item-photo" alt={i.name}/>:<span className="item-no-photo"><ImageIcon size={28}/></span>}<div className="item-row-copy"><small>{i.category}</small><Link className="item-name-link" href={"/item/"+encodeURIComponent(i.id)+"?voltar=colecao/"+encodeURIComponent(id)}><strong>{i.name}</strong></Link><span>{i.brand}</span><Link className="edit-in-collection" href={"/item/"+encodeURIComponent(i.id)}>Ver ficha técnica <ArrowRight size={16}/></Link>{i.notes&&<p>{i.notes}</p>}{owner&&<Link className="edit-in-collection" href={"/itens?editar="+encodeURIComponent(i.id)+"&voltar="+encodeURIComponent(id)}><Edit3 size={16}/> Editar item</Link>}{owner&&<button type="button" className="remove-from-collection" disabled={working} onClick={()=>void unlink(i)}><X size={16}/> Remover desta coleção</button>}</div></div>)}</div>:<div className="empty-collection-panel">{items.length?'Nenhum item corresponde à busca.':'Esta coleção ainda não tem itens.'}</div>}
  {owner&&picker&&<div className="edit-overlay" role="dialog" aria-modal="true" aria-label="Adicionar itens à coleção"><section className="edit-modal collection-picker"><button className="close-modal" aria-label="Fechar" onClick={()=>{setPicker(false);setSearch('');setPending([])}}><X size={21}/></button><h2>Adicionar itens</h2><p>Selecione itens que já existem no seu acervo.</p><label className="collection-search"><Search size={18}/><input autoFocus aria-label="Buscar no acervo" placeholder="Nome, marca ou categoria" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="picker-options">{available.map(i=><label key={i.id} className="picker-option"><input type="checkbox" checked={pending.includes(i.id)} onChange={e=>setPending(prev=>e.target.checked?[...prev,i.id]:prev.filter(x=>x!==i.id))}/><span><strong>{i.name}</strong><small>{i.brand||i.category}</small></span>{pending.includes(i.id)&&<Check size={17}/>}</label>)}{available.length===0&&<p>Nenhum item disponível para adicionar.</p>}</div><button className="save-item-button" disabled={working||!pending.length} onClick={()=>void addExisting()}>{working?'Adicionando…':'Adicionar '+pending.length+' '+(pending.length===1?'item':'itens')}</button></section></div>}
  <Link href="/explorar" className="pill-btn">Descobrir outras coleções <ArrowRight size={18}/></Link>
 </section>
}
