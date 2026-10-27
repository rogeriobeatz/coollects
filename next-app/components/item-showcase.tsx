'use client'
import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import {Heart,Share2,LockKeyhole,ExternalLink,Users} from 'lucide-react'
import {useAccount} from '@/hooks/use-account'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
import {ItemCollectionPicker} from './item-collection-picker'
import {ItemCardViewer} from './item-card-viewer'
import {ItemGallery} from './item-gallery'
import {ItemComments} from './item-comments'
import {ShareButton} from './share-button'
import {FollowButton,LikeButton,useFollowing,useItemSocial} from './social-interactions'
import {CollectorAvatar} from './collector-avatar'
import {ConnectionsSheet} from './connections-sheet'
import {ItemRow,CollectionRow,ProfileRow,publicUrlPath} from '@/lib/catalog'
import {readAll,readChunks} from '@/lib/pagination'
type ItemInfo=ItemRow&{photoUrl:string|null;galleryUrls:string[]}
export function ItemShowcase({id}:{id:string}){
 const {user}=useAccount()
 const [item,setItem]=useState<ItemInfo|null>(null)
 const [owner,setOwner]=useState<ProfileRow|null>(null)
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [visibilityError,setVisibilityError]=useState(false)
 const [picker,setPicker]=useState(false)
 const [sharing,setSharing]=useState(false)
 const [likers,setLikers]=useState(false)
 const refresh=useCallback(async(silent=false)=>{
  const db=getBrowserClient()
  if(!db){setError('Serviço indisponível.');if(!silent)setLoading(false);return}
  if(!silent)setLoading(true)
  setError('');if(!silent)setVisibilityError(false)
  try{
   const {data,error:itemError}=await db.from('items').select('*').eq('id',id).maybeSingle()
   if(itemError||!data){
    setError('Este item é privado ou não está disponível.')
    if(!silent)setItem(null)
    return
   }
   const result=data as ItemRow
   const [profileResponse,linksResponse,url,gallery]=await Promise.all([
    db.from('profiles').select('*').eq('id',result.owner_id).maybeSingle(),
    readAll<{collection_id:string}>((from,to)=>db.from('collection_items').select('collection_id',{count:'exact'}).eq('item_id',id).order('collection_id').range(from,to)).then(data=>({data,error:null})).catch(error=>({data:[] as {collection_id:string}[],error})),
    signedImage(db,result.photo_path).catch(()=>null),
    Promise.all((result.gallery_paths||[]).map(path=>signedImage(db,path,{full:true}).catch(()=>null)))
   ])
   let visibleCollections:CollectionRow[]=[]
   let failedVisibility=Boolean(linksResponse.error)
   if(!failedVisibility){
    const ids=(linksResponse.data||[]).map(link=>link.collection_id)
    if(ids.length){
     try{visibleCollections=await readChunks<CollectionRow>(ids,chunk=>readAll((from,to)=>db.from('collections').select('*',{count:'exact'}).in('id',chunk).order('id').range(from,to)))}catch{failedVisibility=true}
    }
   }
   setVisibilityError(failedVisibility&&!result.is_public)
   setCollections(visibleCollections)
   setItem({...result,photoUrl:url,galleryUrls:gallery.filter((u):u is string=>Boolean(u))})
   setOwner((profileResponse.data||null) as ProfileRow|null)
   upgradePhoto(db,result.photo_path)
  }catch{
   setError('Não foi possível carregar este item. Verifique sua conexão e tente novamente.')
   if(!silent)setItem(null)
  }finally{if(!silent)setLoading(false)}
 },[id])
 useEffect(()=>{void refresh()},[refresh])
 const publicCollection=Boolean(item?.is_public)||collections.some(c=>c.is_public)
 const {social,status:socialStatus,retry:retryLikes}=useItemSocial(item&&publicCollection?[item.id]:[])
 const itemSocial=item?social.get(item.id):undefined
 const ownerFollowed=useFollowing(owner?.id)
 // Show the cached small copy first, then swap in the full photo once loaded.
 function upgradePhoto(db:NonNullable<ReturnType<typeof getBrowserClient>>,path:string|null){
  if(!path)return
  void signedImage(db,path,{full:true}).then(full=>{
   if(!full)return
   const img=new Image();img.onload=()=>setItem(v=>v&&v.photo_path===path?{...v,photoUrl:full}:v);img.src=full
  }).catch(()=>{/* The compressed image is still available. */})
 }
 if(loading)return <section className="item-showcase-state">Preparando a ficha técnica…</section>
 if(!item)return <section className="item-showcase-state"><LockKeyhole size={35}/><h2>Item indisponível</h2><p>{error}</p><button type="button" className="pill-btn" onClick={()=>void refresh()}>Tentar novamente</button><Link href="/explorar">Explorar coleções</Link></section>
 const isOwner=user?.id===item.owner_id
 const ownerName=owner?(owner.display_name||owner.username):''
 return <article className="collectible-detail">
  <div className="collectible-toolbar"><span>{item.category}</span>{isOwner&&<div className="owner-management"><Link href={'/itens?editar='+encodeURIComponent(item.id)}>Editar <ExternalLink size={14}/></Link><Link className="owner-delete" href={'/itens?excluir='+encodeURIComponent(item.id)}>Excluir</Link></div>}</div>
  <ItemCardViewer item={item} photoUrl={item.photoUrl} headingLevel="h1"/>
  <ItemGallery name={item.name} urls={item.galleryUrls}/>
  {visibilityError&&<p className="profile-inline-error" role="alert">Não foi possível confirmar a visibilidade deste item. <button type="button" onClick={()=>void refresh(true)}>Tentar novamente</button></p>}
  <div className="item-social">
   <div className="item-owner-row">
    {owner?<Link className="item-owner" href={publicUrlPath(owner.username)}>
     <CollectorAvatar name={ownerName} seed={owner.id} size="sm"/>
     <span><strong>{ownerName}</strong><small>@{owner.username}{collections.length>0?' · '+collections.map(c=>c.name).join(' · '):''}</small></span>
    </Link>:<strong className="item-owner">Coollects</strong>}
    {owner&&!isOwner&&<FollowButton profileId={owner.id} name={ownerName} following={ownerFollowed}/>}
   </div>
   {publicCollection&&socialStatus==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar as curtidas. <button type="button" onClick={retryLikes}>Tentar novamente</button></p>}
   <div className="item-social-actions">
    {publicCollection&&(itemSocial?<LikeButton size="detail" itemId={item.id} itemName={item.name} ownerId={item.owner_id} social={itemSocial}/>:socialStatus==='loading'&&<span className="like-button like-detail is-placeholder" aria-hidden="true"><Heart size={22}/></span>)}
    {publicCollection&&itemSocial&&itemSocial.likes>0&&<button type="button" className="item-social-icon" aria-label="Ver quem curtiu" title="Ver quem curtiu" onClick={()=>setLikers(true)}><Users size={19} aria-hidden="true"/></button>}
    <span className="item-social-spacer"/>
    {publicCollection?<ShareButton className="item-social-icon is-primary" path={'/item/'+encodeURIComponent(item.id)} title={item.name} text={'Olha este item'+(owner?' do acervo de '+ownerName:'')+' no Coollects: '+item.name} icon={<Share2 size={19} aria-hidden="true"/>}><span className="visually-hidden">Compartilhar</span></ShareButton>
     :isOwner&&!visibilityError&&<button type="button" className="item-social-icon is-private" aria-label="Compartilhar" title="Compartilhar" onClick={()=>{setSharing(true);setPicker(true)}}><LockKeyhole size={18} aria-hidden="true"/></button>}
   </div>
  </div>
  {publicCollection&&<ItemComments itemId={item.id} ownerId={item.owner_id}/>}
  {likers&&<ConnectionsSheet targetId={item.id} kinds={['likers']} initial="likers" label={'Quem curtiu '+item.name} counts={itemSocial?{likers:itemSocial.likes}:{}} onClose={()=>setLikers(false)}/>}
  {isOwner&&!visibilityError&&<div className="item-showcase-hint"><p>{publicCollection?'Este item está público e pode aparecer na comunidade.':'Este item ainda é privado. Vincule a uma coleção pública para compartilhá-lo.'}</p><button type="button" className="pill-btn" onClick={()=>{setSharing(false);setPicker(true)}}>Adicionar a uma coleção</button></div>}
  {picker&&isOwner&&<ItemCollectionPicker sharing={sharing} itemId={item.id} onClose={()=>setPicker(false)} onChanged={()=>void refresh(true)}/>}
  {item.notes&&<details className="collectible-more"><summary>História e observações</summary><p>{item.notes}</p></details>}
  {collections.length>0&&<details className="collectible-more"><summary>Ver coleções</summary><div className="item-showcase-collections">{collections.map(c=><Link href={'/colecao/'+encodeURIComponent(c.id)} key={c.id}>{c.name} <ExternalLink size={14}/></Link>)}</div></details>}
  {error&&<p role="alert">{error}</p>}
 </article>
}
