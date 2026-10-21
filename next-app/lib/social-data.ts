import type { SupabaseClient } from '@supabase/supabase-js'
import { PROFILE_SELECT, type CollectionRow, type ItemRow } from './catalog'
import { collectionPreviewItems, type CollectionPhoto, type PreviewLink } from './collection-previews'
import { signedImages } from './images'
import {
 PAGE_SIZE, toProfileSocial,
 type ActivityEntry, type CollectorSummary, type Connection, type ConnectionKind, type ItemSocial, type ProfileSocial, type SuggestedCollector
} from './social'

/* ---------- Shared state between components on the same page ---------- */

type SocialEvent=
 |{type:'follow';profileId:string;following:boolean}
 |{type:'like';itemId:string;ownerId:string;social:ItemSocial;change:1|-1}
 |{type:'saved';action:'follow'|'like'}
 |{type:'error';message:string}

const bus=typeof EventTarget==='undefined'?null:new EventTarget()

/** Keeps every card, header and list in sync after a follow or a like. */
export function emitSocial(event:SocialEvent){bus?.dispatchEvent(new CustomEvent('social',{detail:event}))}
export function onSocial(listener:(event:SocialEvent)=>void){
 if(!bus)return ()=>{}
 const handler=(event:Event)=>listener((event as CustomEvent<SocialEvent>).detail)
 bus.addEventListener('social',handler)
 return ()=>bus.removeEventListener('social',handler)
}

/* ---------- Reads ---------- */

export async function loadProfileSocial(db:SupabaseClient,profileId:string):Promise<ProfileSocial>{
 const {data,error}=await db.rpc('profile_social_summary',{p_profile_id:profileId})
 if(error)throw error
 return toProfileSocial(data)
}

export async function loadItemSocial(db:SupabaseClient,itemIds:string[]):Promise<Map<string,ItemSocial>>{
 const result=new Map<string,ItemSocial>()
 const ids=[...new Set(itemIds)]
 if(!ids.length)return result
 // The RPC bounds each request to 200; long feeds still need every card.
 for(let start=0;start<ids.length;start+=200){
  const {data,error}=await db.rpc('item_social_summary',{p_item_ids:ids.slice(start,start+200)})
  if(error)throw error
  for(const row of (data||[]) as {item_id:string;likes:number|string;liked_by_me:boolean}[])
   result.set(row.item_id,{likes:Number(row.likes)||0,liked:row.liked_by_me===true})
 }
 return result
}

export async function loadConnections(db:SupabaseClient,kind:ConnectionKind,targetId:string,offset=0):Promise<Connection[]>{
 const {data,error}=kind==='likers'
  ?await db.rpc('item_likers',{p_item_id:targetId,p_limit:30,p_offset:offset})
  :await db.rpc('profile_connections',{p_profile_id:targetId,p_direction:kind,p_limit:30,p_offset:offset})
 if(error)throw error
 return (data||[]) as Connection[]
}

export type ItemListKind='public'|'liked'|'home'|'community'
export type SocialItem=ItemRow&{url:string|null}
/** Feed posts are large, so they load in smaller pages. */
export const FEED_PAGE_SIZE=12

/** One page of items plus their photos, ready for CollectibleCard. */
export async function loadItemPage(db:SupabaseClient,kind:ItemListKind,profileId:string|null,offset=0):Promise<{items:SocialItem[];hasMore:boolean}>{
 const feed=kind==='home'||kind==='community'
 const size=feed?FEED_PAGE_SIZE:PAGE_SIZE
 const {data,error}=feed
  ?await db.rpc(kind==='home'?'home_feed':'community_feed',{p_limit:size,p_offset:offset})
  :await db.rpc(kind==='liked'?'profile_liked_items':'profile_public_items',{p_profile_id:profileId,p_limit:size,p_offset:offset})
 if(error)throw error
 const items=(data||[]) as ItemRow[]
 const photos=await signedImages(db,items.map(item=>item.photo_path))
 return {
  items:items.map(item=>({...item,url:item.photo_path?photos.get(item.photo_path)??null:null})),
  hasMore:items.length===size
 }
}

/** Public identity of several collectors (feed authors). */
export async function loadCollectors(db:SupabaseClient,ids:string[]):Promise<Map<string,CollectorSummary>>{
 const unique=[...new Set(ids)]
 if(!unique.length)return new Map()
 const {data,error}=await db.from('profiles').select(PROFILE_SELECT).in('id',unique)
 if(error)throw error
 return new Map(((data||[]) as CollectorSummary[]).map(row=>[row.id,row]))
}

export async function loadSuggestions(db:SupabaseClient,limit=12):Promise<SuggestedCollector[]>{
 const {data,error}=await db.rpc('suggested_collectors',{p_limit:limit})
 if(error)throw error
 return ((data||[]) as SuggestedCollector[]).map(row=>({...row,followers:Number(row.followers)||0,public_items:Number(row.public_items)||0}))
}

export async function loadActivity(db:SupabaseClient,limit=30):Promise<ActivityEntry[]>{
 const {data,error}=await db.rpc('my_social_activity',{p_limit:limit})
 if(error)throw error
 return (data||[]) as ActivityEntry[]
}

/** Public collections of a collector with item counts and up to two photos each. */
export async function loadPublicCollections(db:SupabaseClient,ownerId:string){
 const {data,error}=await db.from('collections').select('*').eq('owner_id',ownerId).eq('is_public',true).order('created_at',{ascending:false})
 if(error)throw error
 const collections=(data||[]) as CollectionRow[]
 const joined=collections.length
  ?await db.from('collection_items').select('collection_id,item_id,created_at,items(id,name,photo_path)').in('collection_id',collections.map(c=>c.id)).order('created_at',{ascending:true})
  :{data:[],error:null}
 if(joined.error)throw joined.error
 const picked=collectionPreviewItems(collections,(joined.data||[]) as unknown as PreviewLink[])
 const urls=await signedImages(db,Object.values(picked.previews).flat().map(item=>item.photo_path))
 const photos:Record<string,CollectionPhoto[]>={}
 for(const [id,items] of Object.entries(picked.previews))photos[id]=items.flatMap(item=>{
  const src=item.photo_path?urls.get(item.photo_path):null
  return src?[{src,name:item.name}]:[]
 })
 return {collections,counts:picked.counts,photos}
}

/* ---------- Writes (RLS validates ownership and visibility) ---------- */

/** A repeated follow/like (another tab, double tap) counts as success. */
const isDuplicate=(error:{code?:string}|null)=>error?.code==='23505'

export async function setFollowing(db:SupabaseClient,userId:string,profileId:string,follow:boolean){
 const {error}=follow
  ?await db.from('user_follows').insert({follower_id:userId,followed_id:profileId})
  :await db.from('user_follows').delete().eq('follower_id',userId).eq('followed_id',profileId)
 if(error&&!isDuplicate(error))throw error
}

export async function setLiked(db:SupabaseClient,userId:string,itemId:string,like:boolean){
 const {error}=like
  ?await db.from('item_likes').insert({user_id:userId,item_id:itemId})
  :await db.from('item_likes').delete().eq('user_id',userId).eq('item_id',itemId)
 if(error&&!isDuplicate(error))throw error
}
