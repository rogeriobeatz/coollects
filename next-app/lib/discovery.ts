import type {SupabaseClient} from '@supabase/supabase-js'
import {COLLECTION_SELECT,type CollectionRow} from './catalog'
export type DiscoveredCollection=CollectionRow&{author:{id:string;display_name:string;username:string}|null}
export const DISCOVERY_PAGE_SIZE=24

/** Quote PostgREST grammar and treat user wildcards as literal search text. */
export function searchPattern(query:string){
 const pattern='%'+query.trim().replace(/[\\%_]/g,'\\$&')+'%'
 return '"'+pattern.replace(/[\\"]/g,'\\$&')+'"'
}

/** Empty embed filters authors without hiding their display identity.
 * https://docs.postgrest.org/en/v13/references/api/resource_embedding.html#or-filtering-across-embedded-resources
 */
export async function discoverCollections(db:SupabaseClient,query:string,category:string,offset:number){
 const term=query.trim()
 let request=db.from('collections').select(COLLECTION_SELECT+',author:profiles!collections_owner_id_fkey(id,display_name,username)'+(term?',matched_author:profiles!collections_owner_id_fkey()':''))
  .eq('is_public',true).order('created_at',{ascending:false}).order('id')
 if(category!=='Tudo')request=request.eq('category',category)
 if(term){
  const pattern=searchPattern(term)
  request=request.or('display_name.ilike.'+pattern+',username.ilike.'+pattern,{referencedTable:'matched_author'})
   .or(['name','category','description'].map(field=>field+'.ilike.'+pattern).join(',')+',matched_author.not.is.null')
 }
 const {data,error}=await request.range(offset,offset+DISCOVERY_PAGE_SIZE-1)
 if(error)throw error
 const rows=(data||[]) as unknown as DiscoveredCollection[]
 return {rows,hasMore:rows.length===DISCOVERY_PAGE_SIZE}
}
