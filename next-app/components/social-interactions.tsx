'use client'
import { useEffect,useRef,useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart,UserCheck,UserPlus } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAccount } from '@/hooks/use-account'
import { publicUrlPath } from '@/lib/catalog'
import { countLabel,formatCount,signInHref,type CollectorSummary,type ItemSocial } from '@/lib/social'
import { emitSocial,loadItemSocial,onSocial,setFollowing,setLiked } from '@/lib/social-data'
import { CollectorAvatar } from './collector-avatar'
import { FeedbackNotice } from './feedback-notice'

/** Follow / unfollow with an instant response; reverts if the server refuses. */
export function FollowButton({profileId,name,following:initial,followsMe=false,compact=false}:{
 profileId:string;name:string;following:boolean;followsMe?:boolean;compact?:boolean
}){
 const {user,loading}=useAccount()
 const path=usePathname()
 const [following,setState]=useState(initial)
 const busy=useRef(false)
 useEffect(()=>setState(initial),[initial])
 useEffect(()=>onSocial(event=>{if(event.type==='follow'&&event.profileId===profileId)setState(event.following)}),[profileId])
 if(user?.id===profileId)return null
 const className='follow-button'+(following?' is-following':'')+(compact?' is-compact':'')
 const label=following?'Seguindo':followsMe?'Seguir de volta':'Seguir'
 const Icon=following?UserCheck:UserPlus
 if(!loading&&!user)return <Link className={className} href={signInHref(path)} aria-label={'Entre para seguir '+name}><Icon size={compact?17:18} aria-hidden="true"/>{!compact&&<span>Seguir</span>}</Link>
 async function toggle(){
  const db=getBrowserClient()
  if(!user||!db||busy.current)return
  busy.current=true
  const next=!following
  emitSocial({type:'follow',profileId,following:next})
  try{await setFollowing(db,user.id,profileId,next);emitSocial({type:'saved',action:'follow'})}
  catch{
   emitSocial({type:'follow',profileId,following:!next})
   emitSocial({type:'error',message:next?'Não foi possível seguir '+name+'. Tente novamente.':'Não foi possível deixar de seguir '+name+'. Tente novamente.'})
  }
  finally{busy.current=false}
 }
 return <button type="button" className={className} aria-pressed={following} disabled={loading} onClick={()=>void toggle()}
  aria-label={compact?(following?'Seguindo ':'Seguir ')+name:undefined} title={compact?(following?'Deixar de seguir ':'Seguir ')+name:undefined}>
  <Icon size={compact?17:18} aria-hidden="true"/>{!compact&&<><span>{label}</span><span className="visually-hidden"> {name}</span></>}
 </button>
}

/** Heart + count. Owners see the count only; visitors are invited to sign in. */
export function LikeButton({itemId,itemName,ownerId,social,size='card'}:{
 itemId:string;itemName:string;ownerId:string;social:ItemSocial;size?:'card'|'detail'
}){
 const {user,loading}=useAccount()
 const path=usePathname()
 const [state,setState]=useState(social)
 const [pop,setPop]=useState(false)
 const busy=useRef(false)
 useEffect(()=>setState({likes:social.likes,liked:social.liked}),[social.likes,social.liked])
 useEffect(()=>onSocial(event=>{if(event.type==='like'&&event.itemId===itemId)setState(event.social)}),[itemId])
 const className='like-button like-'+size+(state.liked?' is-liked':'')+(pop?' is-popping':'')
 const heart=<Heart size={size==='detail'?22:17} aria-hidden="true" fill={state.liked?'currentColor':'none'}/>
 const count=<span className="like-count">{formatCount(state.likes)}</span>
 const summary=countLabel(state.likes,'curtida','curtidas')
 if(user?.id===ownerId)return <span className={className+' is-static'} role="img" aria-label={summary}>{heart}{count}</span>
 if(!loading&&!user)return <Link className={className} href={signInHref(path)} aria-label={'Entre para curtir '+itemName+' · '+summary}>{heart}{count}</Link>
 async function toggle(){
  const db=getBrowserClient()
  if(!user||!db||busy.current)return
  busy.current=true
  const previous=state
  const next={liked:!state.liked,likes:Math.max(0,state.likes+(state.liked?-1:1))}
  emitSocial({type:'like',itemId,ownerId,social:next,change:next.liked?1:-1})
  if(next.liked)setPop(true)
  try{await setLiked(db,user.id,itemId,next.liked);emitSocial({type:'saved',action:'like'})}
  catch{
   emitSocial({type:'like',itemId,ownerId,social:previous,change:previous.liked?1:-1})
   emitSocial({type:'error',message:'Não foi possível atualizar a curtida. Tente novamente.'})
  }
  finally{busy.current=false}
 }
 return <button type="button" className={className} aria-pressed={state.liked} aria-label={'Curtir '+itemName+' · '+summary} disabled={loading} onClick={()=>void toggle()} onAnimationEnd={()=>setPop(false)}>{heart}{count}</button>
}

/** Whether the signed-in viewer follows a profile (false for visitors and owners). */
export function useFollowing(profileId:string|null|undefined){
 const {user}=useAccount()
 const [following,setState]=useState(false)
 useEffect(()=>{
  const db=getBrowserClient()
  if(!db||!user||!profileId||user.id===profileId){setState(false);return}
  let active=true
  void db.from('user_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',profileId).maybeSingle()
   .then(({data})=>{if(active)setState(Boolean(data))})
  return ()=>{active=false}
 },[user?.id,profileId])
 return following
}

export type SocialStatus='loading'|'ready'|'error'

/** Likes for every card in a list with one request; stays in sync with the page. */
export function useItemSocial(itemIds:string[]){
 const {user,loading}=useAccount()
 const key=[...new Set(itemIds)].sort().join(',')
 const [map,setMap]=useState<Map<string,ItemSocial>>(()=>new Map())
 const [status,setStatus]=useState<SocialStatus>('loading')
 const [attempt,setAttempt]=useState(0)
 useEffect(()=>{
  if(loading)return
  const ids=key?key.split(','):[]
  setMap(new Map())
  const db=getBrowserClient()
  if(!ids.length){setStatus('ready');return}
  if(!db){setStatus('error');return}
  let active=true
  setStatus('loading')
  loadItemSocial(db,ids)
   .then(result=>{if(!active)return;setMap(result);setStatus('ready')})
   .catch(()=>{if(active)setStatus('error')})
  return ()=>{active=false}
 },[key,user?.id,loading,attempt])
 useEffect(()=>onSocial(event=>{
  if(event.type!=='like')return
  setMap(previous=>{if(!previous.has(event.itemId))return previous;const next=new Map(previous);next.set(event.itemId,event.social);return next})
 }),[])
 return {social:map,status,retry:()=>setAttempt(value=>value+1)}
}

/** Footer for CollectibleCard: optional author and the like control. */
export function CardSocialBar({itemId,itemName,ownerId,social,status,author}:{
 itemId:string;itemName:string;ownerId:string;social?:ItemSocial;status:SocialStatus;author?:CollectorSummary|null
}){
 if(!author&&!social&&status!=='loading')return null
 return <div className="cc-social-bar">
  {author&&<Link className="cc-social-author" href={publicUrlPath(author.username)} aria-label={'Ver perfil de '+author.display_name} title={author.display_name+' · @'+author.username}><CollectorAvatar name={author.display_name} seed={author.id} size="xs"/><span>{author.display_name.trim().split(/\s+/)[0]||'@'+author.username}</span></Link>}
  {social?<LikeButton itemId={itemId} itemName={itemName} ownerId={ownerId} social={social}/>:status==='loading'?<span className="like-button like-card is-placeholder" aria-hidden="true"><Heart size={17}/></span>:null}
 </div>
}

/** Errors from follows and likes stay visible until dismissed. */
export function SocialToaster(){
 const [message,setMessage]=useState(''),[serial,setSerial]=useState(0)
 useEffect(()=>onSocial(event=>{if(event.type==='error'){setMessage(event.message);setSerial(value=>value+1)}}),[])
 if(!message)return null
 return <div className="social-toast"><FeedbackNotice key={serial} message={message} kind="error"/></div>
}
