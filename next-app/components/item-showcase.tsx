'use client'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {Copy,Check,Share2,ImageIcon,LockKeyhole,ExternalLink} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
import {ItemCollectionPicker} from './item-collection-picker'
import {itemCardStyle,itemCardPalette} from '@/lib/item-card-theme'
import {ItemRow,CollectionRow,ProfileRow,publicUrlPath} from '@/lib/catalog'
const detailLabels:Record<string,string>={manufacturer:'Montadora',series:'Série',seriesNumber:'Nº na série',collectionNumber:'Nº na coleção',year:'Ano da cartela',scale:'Escala',color:'Cor',condition:'Condição'}
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
  setItem({...result,photoUrl:url});setOwner((profile||null) as ProfileRow|null);setCollections(visibleCollections);setError('');setLoading(false);window.dispatchEvent(new CustomEvent('coollects:page-title',{detail:result.name}))
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
 const details=Object.entries(item.details||{}).filter(([key,val])=>Boolean(detailLabels[key])&&val!==null&&String(val).trim()!=='')
 return <article className="collectible-detail">
  <div className="collectible-toolbar"><span>{item.category}</span>{isOwner&&<Link href={'/itens?editar='+encodeURIComponent(item.id)}>Editar <ExternalLink size={14}/></Link>}</div>
  <div className="collectible-trump-card collectible-deck-hero" style={itemCardStyle(item)}>
   <div className="collectible-card-top"><span>COOLLECTS / COLECIONÁVEL</span><span>#{item.id.slice(0,4).toUpperCase()}</span></div>
   <div className="collectible-card-photo">{item.photoUrl?<img src={item.photoUrl} alt={'Foto de '+item.name}/>:<div className="item-showcase-empty"><ImageIcon size={43}/><span>Sem fotografia</span></div>}</div>
   <div className="collectible-card-heading"><span>{itemCardPalette(item).label} · {item.brand||item.category}</span><h1>{item.name}</h1></div>
   {details.length>0&&<div className="collectible-card-specs">{details.slice(0,6).map(([key,value])=><div key={key}><small>{detailLabels[key]}</small><strong>{String(value)}</strong></div>)}</div>}
   <div className="collectible-card-bottom"><span>{owner?.display_name||owner?.username||'Colecionador Coollects'}</span><span>COOLLECTS ORIGINAL ✦</span></div>
  </div>
  <div className="collectible-actions"><div className="collectible-belongs"><span>DO ACERVO DE</span>{owner?<Link href={publicUrlPath(owner.username)}>{owner.display_name||owner.username}</Link>:<strong>Coollects</strong>}{collections.length>0&&<small>{collections.map(c=>c.name).join(' · ')}</small>}</div><button type="button" className="collectible-share" disabled={!publicCollection} onClick={()=>void share()}>{copied?<Check size={18}/>:publicCollection?<Share2 size={18}/>:<LockKeyhole size={17}/>} {copied?'Copiado!':publicCollection?'Compartilhar':'Privado'}</button></div>
  {isOwner&&<div className="item-showcase-hint"><p>{publicCollection?'Este item faz parte de uma coleção pública.':'Para compartilhar, adicione este item a uma coleção pública.'}</p><button type="button" className="pill-btn" onClick={()=>setPicker(true)}>Adicionar a uma coleção</button></div>}
  {picker&&isOwner&&<ItemCollectionPicker itemId={item.id} onClose={()=>setPicker(false)} onChanged={()=>void refresh()}/>}
  {details.length>6&&<details className="collectible-more"><summary>Mais características</summary><div className="item-showcase-specs">{details.slice(6).map(([key,val])=><div key={key}><span>{detailLabels[key]}</span><strong>{String(val)}</strong></div>)}</div></details>}
  {item.notes&&<details className="collectible-more"><summary>História e observações</summary><p>{item.notes}</p></details>}
  {collections.length>0&&<details className="collectible-more"><summary>Ver coleções</summary><div className="item-showcase-collections">{collections.map(c=><Link href={'/colecao/'+encodeURIComponent(c.id)} key={c.id}>{c.name} <ExternalLink size={14}/></Link>)}</div></details>}
  {error&&<p role="alert">{error}</p>}
 </article>
}
