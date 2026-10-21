'use client'
import { useCallback,useEffect,useId,useRef,useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Camera,CheckCircle2,Compass,FolderPlus,Package,Share2,Sparkles,Users } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { publicUrlPath } from '@/lib/catalog'
import { mergeById,relativeTime,type CollectorSummary,type Connection,type ItemSocial } from '@/lib/social'
import { loadConnections,loadItemPage,onSocial,type ItemListKind,type SocialItem } from '@/lib/social-data'
import { CollectibleCard } from './collectible-card'
import { CollectorAvatar } from './collector-avatar'
import { ConnectionsSheet } from './connections-sheet'
import { ShareButton } from './share-button'
import { FollowButton,LikeButton,useItemSocial,type SocialStatus } from './social-interactions'
import { useAuthors } from './social-item-grid'
import { SuggestedCollectors } from './suggested-collectors'

type Me={display_name:string;username:string}

/** Home: AI cataloguing first, then a chronological feed of collectors' posts. */
export function HomeFeed({user,aiEnabled}:{user:User;aiEnabled:boolean}){
 const [me,setMe]=useState<Me|null>(null)
 const [itemCount,setItemCount]=useState<number|null>(null)
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  void Promise.all([
   db.from('profiles').select('display_name,username').eq('id',user.id).maybeSingle(),
   db.from('items').select('id',{count:'exact',head:true}).eq('owner_id',user.id)
  ]).then(([profile,items])=>{
   if(!active)return
   if(profile.data)setMe(profile.data as Me)
   if(!items.error)setItemCount(items.count??0)
  }).catch(()=>{/* The composer works without the greeting name. */})
  return ()=>{active=false}
 },[user.id])
 const metadataName=typeof user.user_metadata?.display_name==='string'?user.user_metadata.display_name:''
 const firstName=(me?.display_name||metadataName).trim().split(/\s+/)[0]

 const home=usePagedFeed('home',true)
 const homeDone=home.status==='ready'&&!home.hasMore
 const community=usePagedFeed('community',homeDone)
 const homeIds=new Set(home.items.map(item=>item.id))
 const discoveries=community.items.filter(item=>!homeIds.has(item.id))
 const posts=[...home.items,...discoveries]
 const {social,status,retry:retryLikes}=useItemSocial(posts.map(item=>item.id))
 const authors=useAuthors(posts.map(item=>item.owner_id))
 const [likers,setLikers]=useState<SocialItem|null>(null)
 const postProps={social,status,authors,viewerId:user.id,onLikers:setLikers}
 const firstSteps=itemCount===0

 return <div className="home-feed">
  <AiComposer firstName={firstName} empty={firstSteps} aiEnabled={aiEnabled}/>
  <CollectorsRail userId={user.id} me={me}/>
  {status==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar as curtidas. <button type="button" onClick={retryLikes}>Tentar novamente</button></p>}
  {home.status==='loading'&&<FeedSkeleton/>}
  {home.status==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar seu feed. <button type="button" onClick={home.retry}>Tentar novamente</button></p>}
  {home.refreshError&&<p className="profile-inline-error" role="alert">Não foi possível atualizar seu feed. As postagens anteriores continuam disponíveis. <button type="button" onClick={home.retry}>Tentar novamente</button></p>}
  {home.status==='ready'&&<>
   {home.items.length>0
    ?<div className="feed-list">{home.items.map(item=><FeedPost key={item.id} item={item} {...postProps}/>)}</div>
    :firstSteps?<div className="home-first-item">
     <span className="home-first-symbol" aria-hidden="true"><Package size={34}/></span>
     <p className="kicker">TODA COLEÇÃO TEM UM COMEÇO</p>
     <h2>Qual peça conta<br/>a sua primeira história?</h2>
     <p>{aiEnabled?'Fotografe uma peça que você ama e revise as sugestões da IA antes de salvar.':'Fotografe uma peça que você ama e preencha a ficha.'} Depois é só publicar numa coleção.</p>
     <Link href="/cadastrar">Cadastrar meu primeiro item <Sparkles size={17} aria-hidden="true"/></Link>
    </div>
    :<div className="feed-invite">
     <span className="feed-invite-icon"><Users size={26} aria-hidden="true"/></span>
     <h2>Seu feed começa aqui</h2>
     <p>Siga colecionadores para ver cada peça nova que eles publicarem. Suas peças em coleções públicas também aparecem aqui.</p>
     <Link className="pill-btn" href="/explorar"><Compass size={17} aria-hidden="true"/>Explorar coleções</Link>
    </div>}
   {home.moreError&&<p className="profile-inline-error" role="alert">Não foi possível carregar mais postagens. Tente novamente no botão abaixo.</p>}
   <LoadMore hasMore={home.hasMore} loading={home.loadingMore} automatic={!home.moreError} onMore={home.more}/>
   {homeDone&&home.items.length>0&&<p className="feed-end"><CheckCircle2 size={18} aria-hidden="true"/>Você está em dia</p>}
   {homeDone&&home.items.length===0&&<SuggestedCollectors title="Quem seguir"/>}
   {homeDone&&(discoveries.length>0||community.hasMore)&&<section className="feed-community" aria-labelledby="novidades-comunidade">
    <h2 id="novidades-comunidade"><Sparkles size={18} aria-hidden="true"/>Novidades da comunidade</h2>
    <div className="feed-list">{discoveries.map(item=><FeedPost key={item.id} item={item} suggestion {...postProps}/>)}</div>
    {community.moreError&&<p className="profile-inline-error" role="alert">Não foi possível carregar mais novidades. Tente novamente no botão abaixo.</p>}
    <LoadMore hasMore={community.hasMore} loading={community.loadingMore} automatic={!community.moreError} onMore={community.more}/>
   </section>}
   {homeDone&&community.status==='error'&&<p className="profile-inline-error" role="alert">Não foi possível carregar as novidades da comunidade. <button type="button" onClick={community.retry}>Tentar novamente</button></p>}
   {homeDone&&community.refreshError&&<p className="profile-inline-error" role="alert">Não foi possível atualizar as novidades. <button type="button" onClick={community.retry}>Tentar novamente</button></p>}
  </>}
  {likers&&<ConnectionsSheet targetId={likers.id} kinds={['likers']} initial="likers" label={'Quem curtiu '+likers.name}
   counts={social.get(likers.id)?{likers:social.get(likers.id)!.likes}:{}} onClose={()=>setLikers(null)}/>}
 </div>
}

/** One feed (home or community) with offset paging and de-duplication. */
function usePagedFeed(kind:ItemListKind,enabled:boolean){
 const [items,setItems]=useState<SocialItem[]>([])
 const [status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>(enabled?'loading':'idle')
 const [hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false)
 const [moreError,setMoreError]=useState(false)
 const [refreshError,setRefreshError]=useState(false)
 const [version,setVersion]=useState(0)
 const loaded=useRef(false)
 const busy=useRef(false),generation=useRef(0),nextOffset=useRef(0)
 useEffect(()=>{
  if(!enabled)return
  const db=getBrowserClient()
  if(!db){if(loaded.current)setRefreshError(true);else setStatus('error');return}
  let active=true
  generation.current+=1
  busy.current=true
  setRefreshError(false);setMoreError(false);setLoadingMore(false)
  // Refreshes retain the rendered posts even when the network fails.
  if(!loaded.current)setStatus('loading')
  loadItemPage(db,kind,null,0).then(page=>{if(active){nextOffset.current=page.items.length;setItems(page.items);setHasMore(page.hasMore);loaded.current=true;setStatus('ready')}})
   .catch(()=>{if(active){if(loaded.current)setRefreshError(true);else setStatus('error')}})
   .finally(()=>{if(active)busy.current=false})
  return ()=>{active=false;generation.current+=1}
 },[kind,enabled,version])
 // Following someone new brings their posts into the home feed.
 useEffect(()=>kind==='home'?onSocial(event=>{if(event.type==='saved'&&event.action==='follow')setVersion(value=>value+1)}):undefined,[kind])
 const more=useCallback(async()=>{
  const db=getBrowserClient()
  if(!db||busy.current)return
  const requestGeneration=generation.current
  busy.current=true;setLoadingMore(true);setMoreError(false)
  try{
   const page=await loadItemPage(db,kind,null,nextOffset.current)
   if(generation.current!==requestGeneration)return
   nextOffset.current+=page.items.length
   setItems(current=>mergeById(current,page.items));setHasMore(page.hasMore)
  }
  catch{if(generation.current===requestGeneration)setMoreError(true)}
  finally{if(generation.current===requestGeneration){busy.current=false;setLoadingMore(false)}}
 },[kind,items.length])
 const retry=useCallback(()=>{if(!loaded.current)setStatus('loading');setRefreshError(false);setVersion(value=>value+1)},[])
 return {items,status,hasMore,loadingMore,moreError,refreshError,more,retry}
}

function AiComposer({firstName,empty,aiEnabled}:{firstName:string;empty:boolean;aiEnabled:boolean}){
 return <section className="ai-composer" aria-labelledby="home-ola">
  <h1 id="home-ola">Olá{firstName?<>, <em>{firstName}!</em></>:' de novo!'}</h1>
  <p>{aiEnabled?(empty?'Fotografe sua primeira peça e revise as sugestões da IA.':'Encontrou uma peça nova? Comece pela foto e revise a ficha.'):'Fotografe sua peça e preencha os detalhes do seu acervo.'}</p>
  <Link href="/cadastrar" className="ai-composer-cta" aria-label={aiEnabled?'Catalogar com IA':'Cadastrar item'}>
   <span className="ai-composer-icon"><Camera size={24} aria-hidden="true"/></span>
   <span className="ai-composer-copy"><strong>{aiEnabled?'Catalogar com IA':'Cadastrar item'}</strong><small>{aiEnabled?'Foto da peça → sugestões para revisar':'Foto e detalhes da sua peça'}</small></span>
   <Sparkles size={22} aria-hidden="true" className="ai-composer-spark"/>
  </Link>
  <Link href="/colecoes?criar=1" className="ai-composer-secondary"><FolderPlus size={17} aria-hidden="true"/>Nova coleção</Link>
 </section>
}

/** Stories-like row: you, Explore and the collectors you follow. */
function CollectorsRail({userId,me}:{userId:string;me:Me|null}){
 const [following,setFollowing]=useState<Connection[]>([])
 const [version,setVersion]=useState(0)
 useEffect(()=>{
  const db=getBrowserClient();if(!db)return
  let active=true
  loadConnections(db,'following',userId,0).then(rows=>{if(active)setFollowing(rows)}).catch(()=>{/* The rail still offers You and Explore. */})
  return ()=>{active=false}
 },[userId,version])
 useEffect(()=>onSocial(event=>{if(event.type==='saved'&&event.action==='follow')setVersion(value=>value+1)}),[])
 const name=me?.display_name||'Você'
 return <section className="collectors-rail" aria-label="Colecionadores que você segue">
  <ul>
   <li><Link href="/perfil" className="rail-person"><span className="rail-ring is-me"><CollectorAvatar name={name} seed={userId} size="md"/></span><span>Você</span></Link></li>
   <li><Link href="/explorar" className="rail-person"><span className="rail-ring is-explore"><span className="rail-icon"><Compass size={24} aria-hidden="true"/></span></span><span>Explorar</span></Link></li>
   {following.map(person=><li key={person.id}><Link href={publicUrlPath(person.username)} className="rail-person" aria-label={'Ver perfil de '+person.display_name}>
    <span className="rail-ring"><CollectorAvatar name={person.display_name} seed={person.id} size="md"/></span>
    <span aria-hidden="true">{person.display_name.trim().split(/\s+/)[0]}</span>
   </Link></li>)}
  </ul>
 </section>
}

type PostProps={
 item:SocialItem;social:Map<string,ItemSocial>;status:SocialStatus;authors:Map<string,CollectorSummary>
 viewerId:string;onLikers:(item:SocialItem)=>void;suggestion?:boolean
}

/** A post: who published, the shared item card, then likes, share and caption. */
function FeedPost({item,social,status,authors,viewerId,onLikers,suggestion=false}:PostProps){
 const headingId=useId()
 const author=authors.get(item.owner_id)
 const itemSocial=social.get(item.id)
 const own=item.owner_id===viewerId
 const itemPath='/item/'+encodeURIComponent(item.id)+'?voltar=inicio'
 const name=author?.display_name||'Colecionador'
 return <article className="feed-post" aria-labelledby={headingId}>
  <header className="feed-post-head">
   {author?<Link href={publicUrlPath(author.username)} className="feed-post-author" aria-label={'Ver perfil de '+name}><CollectorAvatar name={name} seed={item.owner_id} size="sm"/></Link>:<span className="collector-avatar avatar-sm is-placeholder" aria-hidden="true"/>}
   <div className="feed-post-meta">
    <span id={headingId}>{author?<Link href={publicUrlPath(author.username)}><strong>{own?'Você':name}</strong></Link>:<strong>{name}</strong>}<span className="visually-hidden"> publicou {item.name}</span></span>
    <small>{author?'@'+author.username+' · ':''}<time dateTime={item.created_at}>{relativeTime(item.created_at)}</time></small>
   </div>
   {suggestion&&author&&!own&&<FollowButton compact profileId={author.id} name={name} following={false}/>}
  </header>
  <CollectibleCard item={item} photoUrl={item.url} href={itemPath}/>
  <div className="feed-post-actions">
   {itemSocial?<LikeButton size="detail" itemId={item.id} itemName={item.name} ownerId={item.owner_id} social={itemSocial}/>:status==='loading'&&<span className="like-button like-detail is-placeholder" aria-hidden="true"/>}
   {itemSocial&&itemSocial.likes>0&&<button type="button" className="item-social-icon" aria-label={'Ver quem curtiu '+item.name} title="Ver quem curtiu" onClick={()=>onLikers(item)}><Users size={19} aria-hidden="true"/></button>}
   <span className="item-social-spacer"/>
   <ShareButton className="item-social-icon" path={'/item/'+encodeURIComponent(item.id)} title={item.name} text={'Olha esta peça'+(author?' do acervo de '+name:'')+' no Coollects: '+item.name} icon={<Share2 size={19} aria-hidden="true"/>}><span className="visually-hidden">Compartilhar {item.name}</span></ShareButton>
  </div>
  {item.notes.trim()&&<Caption author={author?.username} text={item.notes}/>}
 </article>
}

function Caption({author,text}:{author?:string;text:string}){
 const [open,setOpen]=useState(false)
 const long=text.length>140
 return <p className={'feed-post-caption'+(open||!long?' is-open':'')}>
  {author&&<strong>@{author} </strong>}{text}
  {long&&!open&&<button type="button" onClick={()=>setOpen(true)}>mais</button>}
 </p>
}

/** Loads the next page as the end comes into view; the button is the fallback. */
function LoadMore({hasMore,loading,automatic=true,onMore}:{hasMore:boolean;loading:boolean;automatic?:boolean;onMore:()=>void}){
 const ref=useRef<HTMLButtonElement>(null)
 useEffect(()=>{
  const target=ref.current
  if(!target||!hasMore||loading||!automatic||typeof IntersectionObserver==='undefined')return
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))onMore()},{rootMargin:'400px 0px'})
  observer.observe(target)
  return ()=>observer.disconnect()
 },[hasMore,loading,automatic,onMore])
 if(!hasMore)return null
 return <button ref={ref} type="button" className="load-more" disabled={loading} onClick={onMore}>{loading?'Carregando…':'Mostrar mais'}</button>
}

function FeedSkeleton(){
 return <div className="feed-list" aria-busy="true" aria-label="Carregando feed">{[0,1].map(index=><div key={index} className="feed-post is-skeleton">
  <div className="feed-post-head"><span className="collector-avatar avatar-sm"/><span className="feed-skeleton-lines"><i/><i/></span></div>
  <div className="skeleton-card"/>
 </div>)}</div>
}
