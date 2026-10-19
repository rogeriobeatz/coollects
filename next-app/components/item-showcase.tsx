'use client'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {Check,Share2,LockKeyhole,ExternalLink} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
import {ItemCollectionPicker} from './item-collection-picker'
import {ItemCardViewer} from './item-card-viewer'
import {ItemRow,CollectionRow,ProfileRow,publicUrlPath} from '@/lib/catalog'
type ItemInfo=ItemRow&{photoUrl:string|null}
export function ItemShowcase({id}:{id:string}){
 const {user}=useAccount()
 const [item,setItem]=useState<ItemInfo|null>(null)
 const [owner,setOwner]=useState<ProfileRow|null>(null)
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true)
 const [copied,setCopied]=useState(false)
 const [error,setError]=useState('')
 const [picker,setPicker]=useState(false)
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db){setError('Serviço indisponível.');setLoading(false);return}
  setLoading(true)
  const {data,error:itemError}=await db.from('items').select('*').eq('id',id).maybeSingle()
  if(itemError||!data){setError('Este item é privado ou não está disponível.');setItem(null);setLoading(false);return}
  const result=data as ItemRow
  const [{data:profile},{data:links},url]=await Promise.all([
   db.from('profiles').select('*').eq('id',result.owner_id).maybeSingle(),
   db.from('collection_items').select('collection_id').eq('item_id',id),
   signedImage(db,result.photo_path)
  ])
  const ids=(links||[]).map(link=>link.collection_id)
  let visibleCollections:CollectionRow[]=[]
  if(ids.length){
   const {data:rows}=await db.from('collections').select('*').in('id',ids)
   visibleCollections=(rows||[]) as CollectionRow[]
  }
  setItem({...result,photoUrl:url});setOwner((profile||null) as ProfileRow|null);setCollections(visibleCollections);setError('');setLoading(false)
 },[id])
 useEffect(()=>{void refresh()},[refresh])
 async function share(){
  const url=window.location.href
  if(navigator.share){try{await navigator.share({title:item?.name||'Item Coollects',url});return}catch{return}}
  try{await navigator.clipboard.writeText(url);setCopied(true)}catch{setError('Não foi possível copiar. Copie o endereço do navegador.')}
 }
 if(loading)return <section className="item-showcase-state">Preparando a ficha técnica…</section>
 if(!item)return <section className="item-showcase-state"><LockKeyhole size={35}/><h2>Item indisponível</h2><p>{error}</p><Link href="/explorar">Explorar coleções</Link></section>
 const isOwner=user?.id===item.owner_id
 const publicCollection=collections.some(c=>c.is_public)
 return <article className="collectible-detail">
  <div className="collectible-toolbar"><span>{item.category}</span>{isOwner&&<div className="owner-management"><Link href={'/itens?editar='+encodeURIComponent(item.id)}>Editar <ExternalLink size={14}/></Link><Link className="owner-delete" href={'/itens?excluir='+encodeURIComponent(item.id)}>Excluir</Link></div>}</div>
  <ItemCardViewer item={item} photoUrl={item.photoUrl} headingLevel="h1"/>
  <div className="collectible-actions"><div className="collectible-belongs"><span>DO ACERVO DE</span>{owner?<Link href={publicUrlPath(owner.username)}>{owner.display_name||owner.username}</Link>:<strong>Coollects</strong>}{collections.length>0&&<small>{collections.map(c=>c.name).join(' · ')}</small>}</div><button type="button" className="collectible-share" disabled={!publicCollection} onClick={()=>void share()}>{copied?<Check size={18}/>:publicCollection?<Share2 size={18}/>:<LockKeyhole size={17}/>} {copied?'Copiado!':publicCollection?'Compartilhar':'Privado'}</button></div>
  {isOwner&&<div className="item-showcase-hint"><p>{publicCollection?'Este item faz parte de uma coleção pública.':'Para compartilhar, adicione este item a uma coleção pública.'}</p><button type="button" className="pill-btn" onClick={()=>setPicker(true)}>Adicionar a uma coleção</button></div>}
  {picker&&isOwner&&<ItemCollectionPicker itemId={item.id} onClose={()=>setPicker(false)} onChanged={()=>void refresh()}/>}
  {item.notes&&<details className="collectible-more"><summary>História e observações</summary><p>{item.notes}</p></details>}
  {collections.length>0&&<details className="collectible-more"><summary>Ver coleções</summary><div className="item-showcase-collections">{collections.map(c=><Link href={'/colecao/'+encodeURIComponent(c.id)} key={c.id}>{c.name} <ExternalLink size={14}/></Link>)}</div></details>}
  {error&&<p role="alert">{error}</p>}
 </article>
}
