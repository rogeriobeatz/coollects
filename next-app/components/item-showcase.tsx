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
import {ShareButton} from './share-button'
import {FollowButton,LikeButton,useFollowing,useItemSocial} from './social-interactions'
import {CollectorAvatar} from './collector-avatar'
import {ConnectionsSheet} from './connections-sheet'
import {ItemRow,CollectionRow,ProfileRow,publicUrlPath} from '@/lib/catalog'
type ItemInfo=ItemRow&{photoUrl:string|null;galleryUrls:string[]}
export function ItemShowcase({id}:{id:string}){
 const {user}=useAccount()
 const [item,setItem]=useState<ItemInfo|null>(null)
 const [owner,setOwner]=useState<ProfileRow|null>(null)
 const [collections,setCollections]=useState<CollectionRow[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [picker,setPicker]=useState(false)
 const [likers,setLikers]=useState(false)
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db){setError('Serviço indisponível.');setLoading(false);return}
  setLoading(true)
  const {data,error:itemError}=await db.from('items').select('*').eq('id',id).maybeSingle()
  if(itemError||!data){setError('Este item é privado ou não está disponível.');setItem(null);setLoading(false);return}
  const result=data as ItemRow
  const [{data:profile},{data:links},url,gallery]=await Promise.all([
   db.from('profiles').select('*').eq('id',result.owner_id).maybeSingle(),
   db.from('collection_items').select('collection_id').eq('item_id',id),
   signedImage(db,result.photo_path),
   Promise.all((result.gallery_paths||[]).map(path=>signedImage(db,path,{full:true})))
  ])
  const ids=(links||[]).map(link=>link.collection_id)
  let visibleCollections:CollectionRow[]=[]
  if(ids.length){
   const {data:rows}=await db.from('collections').select('*').in('id',ids)
   visibleCollections=(rows||[]) as CollectionRow[]
  }
  setItem({...result,photoUrl:url,galleryUrls:gallery.filter((u):u is string=>Boolean(u))});upgradePhoto(db,result.photo_path);setOwner((profile||null) as ProfileRow|null);setCollections(visibleCollections);setError('');setLoading(false)
 },[id])
 useEffect(()=>{void refresh()},[refresh])
 const publicCollection=collections.some(c=>c.is_public)
 const {social,status:socialStatus,retry:retryLikes}=useItemSocial(item&&publicCollection?[item.id]:[])
 const itemSocial=item?social.get(item.id):undefined
 const ownerFollowed=useFollowing(owner?.id)
 // Show the cached small copy first, then swap in the full photo once loaded.
 function upgradePhoto(db:NonNullable<ReturnType<typeof getBrowserClient>>,path:string|null){
  if(!path)return
  void signedImage(db,path,{full:true}).then(full=>{
   if(!full)return
   const img=new Image();img.onload=()=>setItem(v=>v&&v.photo_path===path?{...v,photoUrl:full}:v);img.src=full
  })
 }
 if(loading)return <section className="item-showcase-state">Preparando a ficha técnica…</section>
 if(!item)return <section className="item-showcase-state"><LockKeyhole size={35}/><h2>Item indisponível</h2><p>{error}</p><Link href="/explorar">Explorar coleções</Link></section>
 const isOwner=user?.id===item.owner_id
 const ownerName=owner?(owner.display_name||owner.username):''
 return <article className="collectible-detail">
  <div className="collectible-toolbar"><span>{item.category}</span>{isOwner&&<div className="owner-management"><Link href={'/itens?editar='+encodeURIComponent(item.id)}>Editar <ExternalLink size={14}/></Link><Link className="owner-delete" href={'/itens?excluir='+encodeURIComponent(item.id)}>Excluir</Link></div>}</div>
  <ItemCardViewer item={item} photoUrl={item.photoUrl} headingLevel="h1"/>
  <ItemGallery name={item.name} urls={item.galleryUrls}/>
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
     :isOwner&&<button type="button" className="item-social-icon is-private" aria-label="Compartilhar" title="Compartilhar" onClick={()=>setPicker(true)}><LockKeyhole size={18} aria-hidden="true"/></button>}
   </div>
  </div>
  {likers&&<ConnectionsSheet targetId={item.id} kinds={['likers']} initial="likers" label={'Quem curtiu '+item.name} counts={itemSocial?{likers:itemSocial.likes}:{}} onClose={()=>setLikers(false)}/>}
  {isOwner&&<div className="item-showcase-hint"><p>{publicCollection?'Este item faz parte de uma coleção pública.':'Para compartilhar, adicione este item a uma coleção pública.'}</p><button type="button" className="pill-btn" onClick={()=>setPicker(true)}>Adicionar a uma coleção</button></div>}
  {picker&&isOwner&&<ItemCollectionPicker itemId={item.id} onClose={()=>setPicker(false)} onChanged={()=>void refresh()}/>}
  {item.notes&&<details className="collectible-more"><summary>História e observações</summary><p>{item.notes}</p></details>}
  {collections.length>0&&<details className="collectible-more"><summary>Ver coleções</summary><div className="item-showcase-collections">{collections.map(c=><Link href={'/colecao/'+encodeURIComponent(c.id)} key={c.id}>{c.name} <ExternalLink size={14}/></Link>)}</div></details>}
  {error&&<p role="alert">{error}</p>}
 </article>
}
