'use client'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {ArrowLeft,Copy,Check,Share2,ImageIcon,LockKeyhole,ExternalLink} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
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
 const details=Object.entries(item.details||{}).filter(([key,val])=>Boolean(detailLabels[key])&&val!==null&&String(val).trim()!=='')
 return <article className="item-showcase">
  <div className="item-showcase-heading"><Link href="/itens" className="item-showcase-back"><ArrowLeft size={17}/> Meu acervo</Link><span className="item-showcase-tag">{item.category}</span></div>
  <div className="item-showcase-hero">
   <div className="item-showcase-photo">{item.photoUrl?<img src={item.photoUrl} alt={'Fotografia de '+item.name}/>:<div className="item-showcase-empty"><ImageIcon size={48}/><span>Fotografia indisponível</span></div>}</div>
   <div className="item-showcase-intro"><p className="kicker">COOLLECTS / FICHA TÉCNICA</p><h1>{item.name}</h1><p>{item.brand||'Colecionável'} · {item.category}</p>
    {owner&&<div className="item-showcase-owner"><span>DO ACERVO DE</span><Link href={publicUrlPath(owner.username)}>{owner.display_name||owner.username} <ExternalLink size={14}/></Link></div>}
    <button type="button" className="item-showcase-share" disabled={!publicCollection} onClick={()=>void share()}>{copied?<Check size={18}/>:<Share2 size={18}/>} {copied?'Link copiado!':publicCollection?'Compartilhar ficha':'Compartilhamento privado'}</button>
    {!publicCollection&&isOwner&&<p className="item-showcase-hint">Adicione este item a uma coleção pública para liberar o compartilhamento.</p>}
   </div>
  </div>
  {details.length>0&&<section className="item-showcase-section"><p className="kicker">CADA DETALHE CONTA</p><h2>Especificações</h2><div className="item-showcase-specs">{details.map(([key,val])=><div key={key}><span>{detailLabels[key]}</span><strong>{String(val)}</strong></div>)}</div></section>}
  <section className="item-showcase-section"><p className="kicker">ONDE ESSA PEÇA VIVE</p><h2>{collections.length===1?'Coleção':'Coleções'}</h2>{collections.length?<div className="item-showcase-collections">{collections.map(c=><Link key={c.id} href={'/colecao/'+encodeURIComponent(c.id)}><span>{c.name}</span><small>{c.is_public?'Coleção pública':'Coleção privada'}</small><ExternalLink size={17}/></Link>)}</div>:<p>Este item ainda não faz parte de uma coleção {isOwner?'— você pode adicioná-lo em Meus itens.':''}</p>}</section>
  {item.notes&&<section className="item-showcase-section"><p className="kicker">HISTÓRIA DA PEÇA</p><h2>Observações</h2><p className="item-showcase-notes">{item.notes}</p></section>}
  {isOwner&&<Link className="pill-btn" href={'/itens?editar='+encodeURIComponent(item.id)}>Editar ficha</Link>}
  {error&&<p role="alert">{error}</p>}
 </article>
}
