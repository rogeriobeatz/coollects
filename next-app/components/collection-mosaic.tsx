'use client'
import {useEffect,useState} from 'react'
import {ImageIcon} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import {signedImage} from '@/lib/images'
export function CollectionMosaic({id,coverId,onCount}:{id:string;coverId?:string|null;onCount?:(value:number)=>void}){
 const [photos,setPhotos]=useState<string[]>([])
 useEffect(()=>{let active=true;const db=getBrowserClient();if(!db)return
  void (async()=>{
   const {data:links,count}=await db.from('collection_items').select('item_id',{count:'exact'}).eq('collection_id',id).limit(32)
   if(active)onCount?.(count??(links||[]).length)
   const ids=(links||[]).map(x=>x.item_id)
   if(!ids.length){if(active)setPhotos([]);return}
   const {data:items}=await db.from('items').select('id,photo_path').in('id',ids)
   const byId=new Map((items||[]).map(i=>[i.id,i.photo_path]))
   const ordered=coverId&&ids.includes(coverId)?[coverId,...ids.filter(x=>x!==coverId)]:ids
   const paths=ordered.map(itemId=>byId.get(itemId)).filter((v):v is string=>Boolean(v)).slice(0,4)
   const urls=await Promise.all(paths.map(path=>signedImage(db,path)))
   if(active)setPhotos(urls.filter((url):url is string=>Boolean(url)))
  })()
  return ()=>{active=false}
 },[id,coverId,onCount])
 return <div className={'collection-mosaic count-'+photos.length} aria-hidden="true">
  {photos.length?photos.map((url,index)=><img key={index} src={url} alt="" loading="lazy"/>):<div className="collection-mosaic-empty"><ImageIcon size={36}/></div>}
 </div>
}
