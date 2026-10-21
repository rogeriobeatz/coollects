/** Pure helpers for the collector social layer (no network, easy to test). */

export type CollectorSummary={id:string;username:string;display_name:string;bio?:string|null}
export type Connection=CollectorSummary&{followed_by_me:boolean;connected_at:string}
export type SuggestedCollector=CollectorSummary&{followers:number;public_items:number}
export type ProfileSocial={
 followers:number;following:number;likes_received:number;likes_given:number
 public_items:number;public_collections:number
 followed_by_me:boolean;follows_me:boolean
}
export type ItemSocial={likes:number;liked:boolean}
export type ActivityEntry={
 kind:'follow'|'like';actor_id:string;username:string;display_name:string
 item_id:string|null;item_name:string|null;happened_at:string;followed_by_me:boolean
}
export type ConnectionKind='followers'|'following'|'likers'

export const EMPTY_PROFILE_SOCIAL:ProfileSocial={followers:0,following:0,likes_received:0,likes_given:0,public_items:0,public_collections:0,followed_by_me:false,follows_me:false}
export const EMPTY_ITEM_SOCIAL:ItemSocial={likes:0,liked:false}
export const PAGE_SIZE=24

const compact=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1})
/** 999 → "999", 1200 → "1,2 mil", 2500000 → "2,5 mi". */
export function formatCount(value:number):string{
 const safe=Number.isFinite(value)&&value>0?Math.floor(value):0
 return safe<1000?String(safe):compact.format(safe).replace(/\s/g,' ')
}

export function plural(count:number,one:string,many:string){return count===1?one:many}

/** "12 seguidores", "1 curtida" — used in accessible names next to icons. */
export function countLabel(count:number,one:string,many:string){return formatCount(count)+' '+plural(count,one,many)}

/** Short relative time in Portuguese for feeds and activity. */
export function relativeTime(iso:string,now:number=Date.now()):string{
 const time=new Date(iso).getTime()
 if(!Number.isFinite(time))return ''
 const seconds=Math.max(0,Math.round((now-time)/1000))
 if(seconds<60)return 'agora'
 const minutes=Math.floor(seconds/60)
 if(minutes<60)return minutes+' min'
 const hours=Math.floor(minutes/60)
 if(hours<24)return hours+' h'
 const days=Math.floor(hours/24)
 if(days<7)return days+' d'
 const date=new Date(time),current=new Date(now)
 return date.toLocaleDateString('pt-BR',{day:'numeric',month:'short',...(date.getFullYear()===current.getFullYear()?{}:{year:'numeric'})}).replace('.','')
}

// Built at runtime: the TypeScript target predates Unicode property escapes in literals.
const NOT_LETTER=new RegExp('[^\\p{L}\\p{N}]','gu')
export type ActivityGroup='Hoje'|'Esta semana'|'Anteriores'
/** Notification sections, like the ones people know from social apps. */
export function activityGroup(iso:string,now:number=Date.now()):ActivityGroup{
 const time=new Date(iso).getTime()
 const today=new Date(now);today.setHours(0,0,0,0)
 if(Number.isFinite(time)&&time>=today.getTime())return 'Hoje'
 if(Number.isFinite(time)&&time>=today.getTime()-6*86400000)return 'Esta semana'
 return 'Anteriores'
}

/** Up to two initials, ignoring emoji and punctuation. */
export function initials(name:string|null|undefined):string{
 const words=(name||'').normalize('NFC').split(/\s+/).map(word=>word.replace(NOT_LETTER,'')).filter(Boolean)
 if(!words.length)return 'C'
 const first=Array.from(words[0])[0]||''
 const last=words.length>1?Array.from(words[words.length-1])[0]||'':''
 return (first+last).toLocaleUpperCase('pt-BR')
}

const TONES=['purple','orange','ink','lilac','mint','yellow'] as const
export type AvatarTone=typeof TONES[number]
/** Stable color per collector, so the same person always looks the same. */
export function avatarTone(seed:string):AvatarTone{
 let hash=0
 for(const char of seed)hash=(hash*31+char.charCodeAt(0))|0
 return TONES[Math.abs(hash)%TONES.length]
}

/** Login link that brings the visitor back to where they were. */
export function signInHref(path:string){return '/entrar?next='+encodeURIComponent(path||'/')}

/** Merges a new page into a list without duplicates (offset paging can overlap). */
export function mergeById<T extends {id:string}>(current:T[],next:T[]):T[]{
 const seen=new Set(current.map(entry=>entry.id))
 return [...current,...next.filter(entry=>!seen.has(entry.id)&&seen.add(entry.id))]
}

export function toProfileSocial(row:unknown):ProfileSocial{
 const value=(Array.isArray(row)?row[0]:row) as Partial<Record<keyof ProfileSocial,unknown>>|null|undefined
 if(!value)return EMPTY_PROFILE_SOCIAL
 return {
  followers:Number(value.followers??0)||0,following:Number(value.following??0)||0,
  likes_received:Number(value.likes_received??0)||0,likes_given:Number(value.likes_given??0)||0,public_items:Number(value.public_items??0)||0,
  public_collections:Number(value.public_collections??0)||0,
  followed_by_me:value.followed_by_me===true,follows_me:value.follows_me===true
 }
}
