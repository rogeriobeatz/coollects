'use client'
import {useEffect,useState} from 'react'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
import {CategoryArt} from './category-art'

/** Use a real photograph if a collection has an available item; fall back safely. */
export function CollectionCover({id,category,emoji,selectedId}:{id:string;category:string;emoji?:string|null;selectedId?:string|null}){
 const [url,setUrl]=useState<string|null>(null)
 useEffect(()=>{
  let active=true
  const db=getBrowserClient()
  if(!db)return
  void (async()=>{
   const {data:links}=await db.from('collection_items').select('item_id').eq('collection_id',id).order('created_at',{ascending:true}).limit(100)
   const ids=(links||[]).map(l=>l.item_id)
   const ordered=selectedId&&ids.includes(selectedId)?[selectedId,...ids.filter(x=>x!==selectedId)]:ids
   if(!ordered.length)return
   const {data:photos}=await db.from('items').select('id,photo_path').in('id',ordered)
   const available=new Map((photos||[]).map(x=>[x.id,x.photo_path]))
   const selected=ordered.find(itemId=>available.get(itemId))
   if(!selected)return
   const photo=await signedImage(db,available.get(selected)||null)
   if(active)setUrl(photo)
  })()
  return ()=>{active=false}
 },[id,selectedId])
 return url?<img className="collection-cover-photo" src={url} alt="" loading="lazy"/>:<CategoryArt category={category} emoji={emoji}/>
}
