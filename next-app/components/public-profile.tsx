'use client'
import { useCallback,useEffect,useState } from 'react'
import Link from 'next/link'
import { Grid2X2,Heart,Layers3,Package,PenLine,Plus,Share2,UserCheck,Users } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAccount } from '@/hooks/use-account'
import { PROFILE_SELECT,collectionUrlPath,publicUrlPath,type CollectionRow,type ProfileRow } from '@/lib/catalog'
import type { CollectionPhoto } from '@/lib/collection-previews'
import { countLabel,formatCount,mergeById,plural,type ConnectionKind,type ProfileSocial } from '@/lib/social'
import { loadItemPage,loadProfileSocial,loadPublicCollections,onSocial,type SocialItem } from '@/lib/social-data'
import { CollectorAvatar } from './collector-avatar'
import { CollectionCard } from './collection-card'
import { ConnectionsSheet } from './connections-sheet'
import { EmptyIllustration } from './empty-illustration'
import { FollowButton } from './social-interactions'
import { ItemGridSkeleton,SocialItemGrid } from './social-item-grid'
import { ShareButton } from './share-button'
import { navigateTabs } from '@/lib/tab-navigation'

type Tab='itens'|'curtidos'
type Shelf={collections:CollectionRow[];counts:Record<string,number>;photos:Record<string,CollectionPhoto[]>}

export function PublicProfile({username}:{username:string}){
 const {user,loading}=useAccount()
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [status,setStatus]=useState<'loading'|'ready'|'missing'|'error'>('loading')
 const [social,setSocial]=useState<ProfileSocial|null>(null)
 const [socialError,setSocialError]=useState(false)
 const [shelf,setShelf]=useState<Shelf|null>(null),[shelfError,setShelfError]=useState(false)
 const [tab,setTab]=useState<Tab>('itens')
 const [sheet,setSheet]=useState<ConnectionKind|null>(null)
 const [attempt,setAttempt]=useState(0)

 useEffect(()=>{
  if(loading)return
  const db=getBrowserClient()
  if(!db){setStatus('error');return}
  let active=true
  setStatus('loading')
  setProfile(null);setSocial(null);setSocialError(false);setShelf(null);setShelfError(false);setSheet(null)
  void (async()=>{
   const {data,error}=await db.from('profiles').select(PROFILE_SELECT).eq('username',username).maybeSingle()
   if(!active)return
   if(error){setStatus('error');return}
   if(!data){setStatus('missing');return}
   const found=data as ProfileRow
   setProfile(found);setStatus('ready')
   // Counters and collections load side by side; either can fail alone.
   void loadProfileSocial(db,found.id).then(value=>{if(active)setSocial(value)}).catch(()=>{if(active)setSocialError(true)})
   void loadPublicCollections(db,found.id).then(value=>{if(active){setShelf(value);setShelfError(false)}}).catch(()=>{if(active)setShelfError(true)})
  })().catch(()=>{if(active)setStatus('error')})
  return ()=>{active=false}
 },[username,attempt,user?.id,loading])

 // Counters follow what happens on the page (follow buttons, likes).
 const profileId=profile?.id,viewerId=user?.id
 useEffect(()=>onSocial(event=>{
  if(!profileId)return
  setSocial(current=>{
   if(!current)return current
   if(event.type==='follow'){
    if(event.profileId===profileId){
     if(current.followed_by_me===event.following)return current
     return {...current,followed_by_me:event.following,followers:Math.max(0,current.followers+(event.following?1:-1))}
    }
    if(viewerId===profileId)return {...current,following:Math.max(0,current.following+(event.following?1:-1))}
   }
   if(event.type==='like'){
    if(event.ownerId===profileId)return {...current,likes_received:Math.max(0,current.likes_received+event.change)}
    if(viewerId===profileId)return {...current,likes_given:Math.max(0,current.likes_given+event.change)}
   }
   return current
  })
 }),[profileId,viewerId])

 if(status==='loading')return <ProfileSkeleton/>
 if(status==='error')return <div className="empty-collection-panel" role="alert"><EmptyIllustration kind="unavailable"/><h2>Não foi possível abrir este perfil.</h2><p>Verifique sua conexão e tente de novo.</p><button type="button" className="pill-btn" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></div>
 if(status==='missing'||!profile)return <div className="empty-collection-panel"><EmptyIllustration kind="unavailable"/><h2>Perfil não encontrado.</h2><p>O endereço pode ter mudado ou o perfil não existe mais.</p><Link className="pill-btn" href="/explorar">Descobrir colecionadores</Link></div>

 const isOwner=user?.id===profile.id
 const name=profile.display_name||profile.username
 const path=publicUrlPath(profile.username)
 const collections=shelf?.collections||[]
 const stat=(Icon:typeof Users,value:number,one:string,many:string)=><><Icon size={17} aria-hidden="true"/><strong>{formatCount(value)}</strong><small>{plural(value,one,many)}</small></>
 return <section className="collector-profile">
  <header className="collector-hero">
   <div className="collector-hero-identity">
    <CollectorAvatar name={name} seed={profile.id} size="lg"/>
    <div className="collector-hero-names">
     <h1>{name}</h1>
     <p><span>@{profile.username}</span>{social?.follows_me&&!isOwner&&<span className="follows-you-chip">Segue você</span>}</p>
    </div>
   </div>
   {(profile.bio||'').trim()&&<p className="collector-hero-bio">{profile.bio}</p>}
   {social&&<ul className="collector-stats" aria-label="Números do perfil">
    <li><a href="#perfil-itens" aria-label={countLabel(social.public_items,'item público','itens públicos')} onClick={()=>setTab('itens')}>{stat(Package,social.public_items,'item','itens')}</a></li>
    <li><button type="button" aria-label={countLabel(social.followers,'seguidor','seguidores')} onClick={()=>setSheet('followers')}>{stat(Users,social.followers,'seguidor','seguidores')}</button></li>
    <li><button type="button" aria-label={countLabel(social.following,'perfil seguido','perfis seguidos')} onClick={()=>setSheet('following')}>{stat(UserCheck,social.following,'seguindo','seguindo')}</button></li>
    <li><span role="img" aria-label={countLabel(social.likes_received,'curtida recebida','curtidas recebidas')}>{stat(Heart,social.likes_received,'curtida','curtidas')}</span></li>
   </ul>}
   <div className="collector-hero-actions">
    {isOwner
     ?<Link className="follow-button collector-edit" href="/perfil/editar"><PenLine size={18} aria-hidden="true"/><span>Editar perfil</span></Link>
     :social&&<FollowButton profileId={profile.id} name={name} following={social.followed_by_me} followsMe={social.follows_me}/>}
    <ShareButton className="collector-hero-icon" path={path} title={name} text={'Conheça as coleções de '+name+' no Coollects'} icon={<Share2 size={19} aria-hidden="true"/>}><span className="visually-hidden">Compartilhar perfil</span></ShareButton>
   </div>
  </header>
  {socialError&&<p className="profile-inline-error" role="alert">Não foi possível carregar as conexões deste perfil. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></p>}

  {(collections.length>0||shelfError||(isOwner&&shelf))&&<section className="profile-section" aria-labelledby="perfil-colecoes">
   <div className="profile-section-head"><h2 id="perfil-colecoes"><Layers3 size={18} aria-hidden="true"/>Coleções</h2>{collections.length>0&&<span>{collections.length}</span>}</div>
   {shelfError?<p className="profile-inline-error" role="alert">Não foi possível carregar as coleções. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></p>
    :collections.length?<div className="profile-collection-rail">{collections.map(collection=><CollectionCard key={collection.id} collection={collection} href={collectionUrlPath(collection.id)} photos={shelf?.photos[collection.id]||[]} meta={countLabel(shelf?.counts[collection.id]||0,'item','itens')}/>)}</div>
    :<Link className="profile-empty-cta" href="/colecoes"><Plus size={18} aria-hidden="true"/><span><strong>Publique sua primeira coleção</strong><small>Coleções públicas aparecem aqui para a comunidade.</small></span></Link>}
  </section>}

  <div className="profile-tabs" role="tablist" aria-label="Conteúdo do perfil" id="perfil-itens" onKeyDown={navigateTabs}>
   <button type="button" role="tab" tabIndex={tab==='itens'?0:-1} id="aba-itens" aria-controls="painel-perfil" aria-selected={tab==='itens'} aria-label="Itens publicados" title="Itens publicados" onClick={()=>setTab('itens')}><Grid2X2 size={20} aria-hidden="true"/><span>Publicados</span>{social&&<b>{formatCount(social.public_items)}</b>}</button>
   <button type="button" role="tab" tabIndex={tab==='curtidos'?0:-1} id="aba-curtidos" aria-controls="painel-perfil" aria-selected={tab==='curtidos'} aria-label="Itens curtidos" title="Itens curtidos" onClick={()=>setTab('curtidos')}><Heart size={20} aria-hidden="true"/><span>Curtidos</span>{social&&<b>{formatCount(social.likes_given)}</b>}</button>
  </div>
  <div className="profile-tab-panel" role="tabpanel" id="painel-perfil" aria-labelledby={tab==='itens'?'aba-itens':'aba-curtidos'}>
   <ProfileItems key={profile.id+tab} profileId={profile.id} kind={tab} isOwner={isOwner} name={name} username={profile.username}/>
  </div>

  {sheet&&<ConnectionsSheet targetId={profile.id} kinds={['followers','following']} initial={sheet} label={'Conexões de '+name}
   counts={social?{followers:social.followers,following:social.following}:{}} onClose={()=>setSheet(null)}/>}
 </section>
}

function ProfileItems({profileId,kind,isOwner,name,username}:{profileId:string;kind:Tab;isOwner:boolean;name:string;username:string}){
 const [items,setItems]=useState<SocialItem[]>([])
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading')
 const [hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false)
 const [moreError,setMoreError]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>onSocial(event=>{if(isOwner&&kind==='curtidos'&&event.type==='saved'&&event.action==='like')setAttempt(value=>value+1)}),[isOwner,kind])
 const listKind=kind==='curtidos'?'liked':'public'
 const load=useCallback(async(offset:number)=>{
  const db=getBrowserClient()
  if(!db)throw new Error('offline')
  return loadItemPage(db,listKind,profileId,offset)
 },[listKind,profileId])
 const first=useCallback(()=>{
  let active=true
  setStatus('loading')
  load(0).then(page=>{if(active){setItems(page.items);setHasMore(page.hasMore);setStatus('ready')}}).catch(()=>{if(active)setStatus('error')})
  return ()=>{active=false}
 },[load,attempt])
 useEffect(()=>first(),[first])
 async function more(){
  if(loadingMore)return
  setMoreError(false)
  setLoadingMore(true)
  try{const page=await load(items.length);setItems(current=>mergeById(current,page.items));setHasMore(page.hasMore)}
  catch{setMoreError(true)}
  finally{setLoadingMore(false)}
 }
 const back='voltar='+encodeURIComponent('u/'+username)
 if(status==='loading')return <ItemGridSkeleton/>
 if(status==='error')return <div className="profile-inline-error" role="alert">Não foi possível carregar os itens. <button type="button" onClick={first}>Tentar novamente</button></div>
 if(!items.length)return <div className="profile-empty">
  <span className="profile-empty-icon">{kind==='curtidos'?<Heart size={26} aria-hidden="true"/>:<Grid2X2 size={26} aria-hidden="true"/>}</span>
  <h3>{kind==='curtidos'?(isOwner?'Seus favoritos aparecem aqui':'Nenhuma curtida ainda'):(isOwner?'Mostre seu acervo':'Nada publicado ainda')}</h3>
  <p>{kind==='curtidos'
   ?(isOwner?'Toque no coração dos itens que você admira na comunidade.':name+' ainda não curtiu itens públicos.')
   :(isOwner?'Itens em coleções públicas aparecem no seu perfil.':name+' ainda não compartilhou itens.')}</p>
  {isOwner&&<Link className="pill-btn" href={kind==='curtidos'?'/explorar':'/colecoes'}>{kind==='curtidos'?'Explorar a comunidade':'Ver minhas coleções'}</Link>}
 </div>
 return <>{moreError&&<p className="profile-inline-error" role="alert">Não foi possível carregar mais itens. Tente novamente no botão Mostrar mais.</p>}
  <SocialItemGrid items={items} storageKey="coollects-profile-view" showAuthors={kind==='curtidos'}
   itemHref={item=>'/item/'+encodeURIComponent(item.id)+'?'+back} hasMore={hasMore} loadingMore={loadingMore} onMore={()=>void more()}/></>
}

function ProfileSkeleton(){
 return <div className="collector-profile" aria-busy="true" aria-label="Carregando perfil">
  <div className="collector-hero is-skeleton"><span className="collector-avatar avatar-lg"/><i/><i/></div>
  <ItemGridSkeleton/>
 </div>
}
