'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell,LogIn } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAccount } from '@/hooks/use-account'
import { loadActivity } from '@/lib/social-data'
import { signInHref } from '@/lib/social'
import { ACTIVITY_SEEN_EVENT,hasUnread,lastSeenActivity } from '@/lib/notifications'

/** Bell with a dot for new followers and likes; visitors get "Entrar" instead. */
export function HeaderNotifications({current=false}:{current?:boolean}){
 const {user,loading}=useAccount()
 const path=usePathname()
 const [unread,setUnread]=useState(false)
 useEffect(()=>{
  const db=getBrowserClient()
  if(!db||!user||current){setUnread(false);return}
  let active=true
  setUnread(false)
  const refresh=()=>loadActivity(db,1).then(rows=>{if(active)setUnread(hasUnread(rows[0]?.happened_at,lastSeenActivity(user.id)))}).catch(()=>{/* The bell still opens the page. */})
  void refresh()
  const clear=(event:Event)=>{if((event as CustomEvent<string>).detail===user.id)setUnread(false)}
  const storage=(event:StorageEvent)=>{if(event.key==='coollects-activity-seen:'+user.id)void refresh()}
  const onFocus=()=>void refresh()
  window.addEventListener(ACTIVITY_SEEN_EVENT,clear)
  window.addEventListener('storage',storage)
  window.addEventListener('focus',onFocus)
  return ()=>{active=false;window.removeEventListener(ACTIVITY_SEEN_EVENT,clear);window.removeEventListener('storage',storage);window.removeEventListener('focus',onFocus)}
 },[user?.id,current,path])
 if(loading)return <span className="header-profile-link" aria-hidden="true"/>
 if(!loading&&!user)return <Link href={signInHref(path)} className="header-profile-link" aria-label="Entrar"><LogIn size={20}/></Link>
 return <Link href="/notificacoes" className={'header-profile-link header-notifications'+(unread?' has-unread':'')} aria-label={unread?'Notificações, há novidades':'Notificações'} aria-current={current?'page':undefined}>
  <Bell size={21}/>{unread&&<span className="header-dot" aria-hidden="true"/>}
 </Link>
}
