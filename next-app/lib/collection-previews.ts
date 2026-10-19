import type { CollectionRow } from './catalog'

export type PreviewItem={id:string;name:string;photo_path:string|null}
export type PreviewLink={collection_id:string;item_id:string;items?:PreviewItem|PreviewItem[]|null}
export type CollectionPhoto={src:string;name:string}

/** Pick at most two real photos per collection, prioritizing its chosen cover. */
export function collectionPreviewItems(collections:CollectionRow[],links:PreviewLink[]){
 const counts:Record<string,number>={}
 const candidates:Record<string,PreviewItem[]>={}
 const ids=new Set(collections.map(collection=>collection.id))
 for(const link of links){
  if(!ids.has(link.collection_id))continue
  counts[link.collection_id]=(counts[link.collection_id]||0)+1
  const item=Array.isArray(link.items)?link.items[0]:link.items
  if(item?.photo_path){
   const list=candidates[link.collection_id]??=[]
   if(!list.some(entry=>entry.id===item.id))list.push(item)
  }
 }
 const previews:Record<string,PreviewItem[]>={}
 for(const collection of collections){
  const list=candidates[collection.id]||[]
  previews[collection.id]=[...list].sort((a,b)=>Number(b.id===collection.cover_item_id)-Number(a.id===collection.cover_item_id)).slice(0,2)
 }
 return {counts,previews}
}
