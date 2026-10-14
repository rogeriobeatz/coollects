'use client'
import { useEffect,useState,type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight,ImageIcon,Layers3 } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { CollectionRow,ItemRow,ProfileRow,publicUrlPath,safeColor } from '@/lib/catalog'
import { CategoryArt } from './category-art'
import { signedImage } from '@/lib/images'
type VisibleItem=ItemRow&{url:string|null}
export function PublicCollection({id}:{id:string}){
 const [collection,setCollection]=useState<CollectionRow|null>(null)
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [items,setItems]=useState<VisibleItem[]>([])
 const [loading,setLoading]=useState(true),[message,setMessage]=useState('')
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setMessage('Não foi possível abrir esta coleção agora. Tente novamente mais tarde.');setLoading(false);return}
  let active=true
  void (async()=>{
   const {data,error}=await db.from('collections').select('*').eq('id',id).maybeSingle()
   if(error||!data){if(active){setMessage('Coleção não encontrada ou privada.');setLoading(false)};return}
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
 if(loading)return <div className="empty-collection-panel">Carregando coleção…</div>
 if(!collection)return <div className="empty-collection-panel"><h2>Essa coleção não está disponível.</h2><p>{message}</p><Link className="pill-btn" href="/explorar">Explorar coleções</Link></div>
 return <section className="public-collection"><div className="public-cover" style={{'--poster-accent':safeColor(collection.color)} as CSSProperties}><CategoryArt category={collection.category}/><span>{collection.category}</span></div>
  <h2>{collection.name}</h2><p>{collection.description||'Uma coleção para compartilhar.'}</p>
  {profile&&<Link href={publicUrlPath(profile.username)} className="collector-byline">por <strong>{profile.display_name}</strong><ArrowRight size={15}/></Link>}
  <div className="section-title-inline"><div><p className="kicker">OLHE DE PERTO</p><h2>{items.length} {items.length===1?'item':'itens'}</h2></div><Layers3 size={24}/></div>
  {items.length?<div className="public-item-list">{items.map(i=><div className="item-row" key={i.id}>{i.url?<img src={i.url} className="item-photo" alt={i.name}/>:<span className="item-no-photo"><ImageIcon size={28}/></span>}<div className="item-row-copy"><small>{i.category}</small><strong>{i.name}</strong><span>{i.brand}</span>{i.notes&&<p>{i.notes}</p>}</div></div>)}</div>:<div className="empty-collection-panel">Esta coleção ainda não tem itens.</div>}
  <Link href="/explorar" className="pill-btn">Descobrir outras coleções <ArrowRight size={18}/></Link>
 </section>
}
