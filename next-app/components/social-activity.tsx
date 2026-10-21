'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { Bell,Compass,Heart,UserPlus } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { publicUrlPath } from '@/lib/catalog'
import { activityGroup,relativeTime,type ActivityEntry,type ActivityGroup } from '@/lib/social'
import { loadActivity } from '@/lib/social-data'
import { markActivitySeen } from '@/lib/notifications'
import { AuthGate } from './auth-gate'
import { CollectorAvatar } from './collector-avatar'
import { FollowButton } from './social-interactions'

/** Notifications page: new followers and likes, grouped by time. */
export function NotificationsScreen(){
 return <section className="notifications-screen">
  <h1 className="notifications-title"><Bell size={22} aria-hidden="true"/>Notificações</h1>
  <AuthGate>{userId=><SocialActivity key={userId} userId={userId}/>}</AuthGate>
 </section>
}

function SocialActivity({userId}:{userId:string}){
 const [entries,setEntries]=useState<ActivityEntry[]|null>(null)
 const [failed,setFailed]=useState(false)
 const [attempt,setAttempt]=useState(0)
 useEffect(()=>{
  const db=getBrowserClient();if(!db){setFailed(true);return}
  let active=true
  setFailed(false)
  loadActivity(db,60).then(rows=>{if(!active)return;setEntries(rows);if(rows[0])markActivitySeen(userId,rows[0].happened_at)}).catch(()=>{if(active)setFailed(true)})
  return ()=>{active=false}
 },[userId,attempt])
 if(failed)return <p className="profile-inline-error" role="alert">Não foi possível carregar suas notificações. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></p>
 if(entries===null)return <ul className="activity-list" aria-busy="true" aria-label="Carregando notificações">{[0,1,2].map(index=><li key={index} className="activity-row is-skeleton"><span className="collector-avatar avatar-sm"/><span><i/><i/></span></li>)}</ul>
 if(!entries.length)return <div className="feed-invite">
  <span className="feed-invite-icon"><Bell size={26} aria-hidden="true"/></span>
  <h2>Tudo tranquilo por aqui</h2>
  <p>Quando alguém seguir você ou curtir uma peça do seu acervo, você verá aqui.</p>
  <Link className="pill-btn" href="/explorar"><Compass size={17} aria-hidden="true"/>Encontrar colecionadores</Link>
 </div>
 const groups=new Map<ActivityGroup,ActivityEntry[]>()
 for(const entry of entries){const group=activityGroup(entry.happened_at);groups.set(group,[...(groups.get(group)||[]),entry])}
 return <div className="social-activity">{[...groups].map(([group,rows])=><section key={group} aria-label={group}>
  <h2>{group}</h2>
  <ul className="activity-list">{rows.map(entry=><ActivityRow key={entry.kind+entry.actor_id+(entry.item_id||'')+entry.happened_at} entry={entry}/>)}</ul>
 </section>)}</div>
}

function ActivityRow({entry}:{entry:ActivityEntry}){
 return <li className="activity-row">
  <Link href={publicUrlPath(entry.username)} className="activity-avatar" aria-label={'Ver perfil de '+entry.display_name}>
   <CollectorAvatar name={entry.display_name} seed={entry.actor_id} size="sm"/>
   <span className={'activity-kind is-'+entry.kind} aria-hidden="true">{entry.kind==='like'?<Heart size={11} fill="currentColor"/>:<UserPlus size={11}/>}</span>
  </Link>
  <p>
   <Link href={publicUrlPath(entry.username)}><strong>{entry.display_name}</strong></Link>
   {entry.kind==='like'&&entry.item_id
    ?<> curtiu <Link href={'/item/'+encodeURIComponent(entry.item_id)}>{entry.item_name}</Link></>
    :' começou a seguir você'}
   <time dateTime={entry.happened_at}>{relativeTime(entry.happened_at)}</time>
  </p>
  {entry.kind==='follow'&&<FollowButton compact profileId={entry.actor_id} name={entry.display_name} following={entry.followed_by_me} followsMe/>}
 </li>
}
