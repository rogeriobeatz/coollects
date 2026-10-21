import type { Page } from '@playwright/test'
import type { CollectionRow, ItemRow } from '../../lib/catalog'
import { resolve } from 'node:path'

export const ownerId='00000000-0000-4000-8000-000000000001'
export const collectionId='00000000-0000-4000-8000-000000000002'
export const itemId='00000000-0000-4000-8000-000000000003'
export const backendUrl=process.env.PLAYWRIGHT_SUPABASE_URL || 'https://example.invalid'
export const collection:CollectionRow={id:collectionId,owner_id:ownerId,name:'Minha garagem',category:'Miniaturas',emoji:'🚀',color:'#6125BF',description:'Minha coleção',is_public:true,created_at:'2026-01-01T00:00:00Z'}
export const item:ItemRow={id:itemId,owner_id:ownerId,name:'Carrinho favorito',brand:'Matchbox',category:'Miniaturas',notes:'',photo_path:null,details:{},created_at:'2026-01-01T00:00:00Z'}

/** A stateful fake Data API: browser tests never write to a real account. */
export const visitorId='00000000-0000-4000-8000-000000000099'

export async function mockAcervo(page:Page,options:{emptyCollections?:boolean;emptyItems?:boolean;viewer?:'owner'|'visitor'}={}){
 const viewerId=options.viewer==='visitor'?visitorId:ownerId
 // A running local app can be tested with its public backend URL. All browser
 // backend calls are intercepted; synthetic cookies never reach the app server.
 await page.route(url=>(url.hostname==='127.0.0.1'||url.hostname==='localhost')&&!url.pathname.startsWith('/_next/'),route=>{
  const headers={...route.request().headers()};delete headers.cookie
  return route.continue({headers})
 })
 await page.route(backendUrl+'/**',route=>route.abort('blockedbyclient'))
 const state={
  collections:options.emptyCollections?[]:[{...collection}],
  items:options.emptyItems?[]:[{...item}],
  links:options.emptyCollections||options.emptyItems?[]:[{collection_id:collectionId,item_id:itemId}],
  zeroDelete:false,
  likes:[] as {user_id:string;item_id:string}[],
  follows:[] as {follower_id:string;followed_id:string}[]
 }
 const user={id:viewerId,aud:'authenticated',role:'authenticated',email:'test@example.invalid',app_metadata:{provider:'email'},user_metadata:{display_name:'Rogério Silva'},created_at:'2026-01-01T00:00:00Z'}
 const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url')
 const exp=Math.floor(Date.now()/1000)+3600
 await page.context().addCookies([{name:'sb-'+new URL(backendUrl).hostname.split('.')[0]+'-auth-token',domain:new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3202').hostname,path:'/',value:'base64-'+encode({access_token:encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:viewerId,exp,aud:'authenticated',role:'authenticated'})+'.test',refresh_token:'test-refresh',expires_at:exp,expires_in:3600,token_type:'bearer',user})}])
 await page.route(backendUrl+'/auth/v1/user',route=>route.fulfill({json:user}))
 await page.route(backendUrl+'/storage/v1/**',route=>{
  const request=route.request(),url=new URL(request.url())
  if(request.method()==='GET')return route.fulfill({path:resolve(process.cwd(),'e2e/fixtures/image2.jpg'),contentType:'image/jpeg'})
  const body=request.headers()['content-type']?.includes('multipart/form-data')?{}:request.postDataJSON()
  if(Array.isArray(body.paths))return route.fulfill({json:body.paths.map((path:string)=>({path,signedURL:'/object/sign/coollects-items/'+path+'?token=test',error:null}))})
  return route.fulfill({json:{signedURL:url.pathname.replace('/storage/v1','')+'?token=test'}})
 })
 await page.route(backendUrl+'/rest/v1/**',route=>{
  const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').pop(),method=request.method()
  const paged=<T,>(rows:T[])=>rows.slice(Number(url.searchParams.get('offset')||0),url.searchParams.has('limit')?Number(url.searchParams.get('offset')||0)+Number(url.searchParams.get('limit')):undefined)
  const matches=(row:Record<string,unknown>)=>[...url.searchParams].every(([key,value])=>{
   if(value.startsWith('eq.'))return String(row[key])===value.slice(3)
   if(value.startsWith('in.('))return value.slice(4,-1).split(',').includes(String(row[key]))
   return true
  })
  if(url.pathname.includes('/rpc/')){
   const body=request.postDataJSON()||{}
   const publicItems=()=>state.items.filter(row=>state.links.some(link=>link.item_id===row.id&&state.collections.some(c=>c.id===link.collection_id&&c.is_public)))
   const social:Record<string,()=>unknown>={
    profile_social_summary:()=>[{
     followers:state.follows.filter(f=>f.followed_id===body.p_profile_id).length,
     following:state.follows.filter(f=>f.follower_id===body.p_profile_id).length,
     likes_received:state.likes.filter(l=>publicItems().some(i=>i.id===l.item_id&&i.owner_id===body.p_profile_id)).length,
     likes_given:state.likes.filter(l=>l.user_id===body.p_profile_id).length,
     public_items:publicItems().filter(i=>i.owner_id===body.p_profile_id).length,
     public_collections:state.collections.filter(c=>c.is_public&&c.owner_id===body.p_profile_id).length,
     followed_by_me:state.follows.some(f=>f.follower_id===viewerId&&f.followed_id===body.p_profile_id),
     follows_me:state.follows.some(f=>f.followed_id===viewerId&&f.follower_id===body.p_profile_id)
    }],
    item_social_summary:()=>(body.p_item_ids||[]).map((id:string)=>({item_id:id,likes:state.likes.filter(l=>l.item_id===id).length,liked_by_me:state.likes.some(l=>l.item_id===id&&l.user_id===viewerId)})),
    profile_public_items:()=>publicItems().filter(i=>i.owner_id===body.p_profile_id),
    profile_liked_items:()=>publicItems().filter(i=>state.likes.some(l=>l.item_id===i.id&&l.user_id===body.p_profile_id)),
    home_feed:()=>publicItems().filter(i=>i.owner_id===viewerId||state.follows.some(f=>f.follower_id===viewerId&&f.followed_id===i.owner_id)),
    community_feed:()=>publicItems().filter(i=>i.owner_id!==viewerId),
    suggested_collectors:()=>viewerId===ownerId||state.follows.some(f=>f.follower_id===viewerId&&f.followed_id===ownerId)?[]:[{id:ownerId,username:'colecionador_test',display_name:'Rogério Silva',bio:'',followers:0,public_items:publicItems().length}],
    // Only the owner profile exists in this fake backend.
    profile_connections:()=>body.p_direction==='following'
     ?state.follows.filter(f=>f.follower_id===body.p_profile_id&&f.followed_id===ownerId).map(f=>({id:ownerId,username:'colecionador_test',display_name:'Rogério Silva',bio:'',followed_by_me:f.follower_id===viewerId,connected_at:'2026-01-01T00:00:00Z'}))
     :[],
    item_likers:()=>[],my_social_activity:()=>[]
   }
   if(table&&social[table])return route.fulfill({json:social[table]()})
   const creating=table==='create_item_with_details'||table==='create_item_with_gallery'
   const id=creating?itemId:body.p_item_id
   const values={name:body.p_name,brand:body.p_brand,category:body.p_category,notes:body.p_notes,photo_path:body.p_photo_path,details:body.p_details}
   if(creating)state.items.push({...item,...values,gallery_paths:body.p_gallery_paths||[],id})
   else if(table==='update_item_with_details')state.items=state.items.map(row=>row.id===id?{...row,...values}:row)
   else return route.fulfill({status:404,json:{message:'Unexpected RPC'}})
   state.links=state.links.filter(link=>link.item_id!==id).concat((body.p_collection_ids||[]).map((collection_id:string)=>({collection_id,item_id:id})))
   return route.fulfill({json:id})
  }
  if(table==='profiles'){
   const profile={id:ownerId,display_name:'Rogério Silva',username:'colecionador_test',bio:''}
   return route.fulfill({json:request.headers()['accept']?.includes('vnd.pgrst.object')?profile:[profile]})
  }
  if(table==='item_likes'||table==='user_follows'){
   const list:Record<string,unknown>[]=table==='item_likes'?state.likes:state.follows
   if(method==='POST')list.push(request.postDataJSON())
   if(method==='DELETE'){const keep=list.filter(row=>!matches(row));list.splice(0,list.length,...keep)}
   const rows=method==='GET'?list.filter(row=>matches(row)):[]
   return route.fulfill({status:method==='POST'?201:200,json:rows})
  }
  if(table==='collection_items'){
   if(method==='POST'){
    const payload=request.postDataJSON()
    state.links.push(...(Array.isArray(payload)?payload:[payload]))
   }
   if(method==='DELETE')state.links=state.links.filter(row=>!matches(row))
   const links=paged(state.links.filter(row=>matches(row)))
   return route.fulfill({json:url.searchParams.get('select')?.includes('items(')?links.map(link=>({...link,items:state.items.find(item=>item.id===link.item_id)||null})):links})
  }
  const rows=table==='collections'?state.collections:table==='items'?state.items:[]
  let result=rows.filter(row=>matches(row))
  if(method==='GET'&&table==='collections'&&url.searchParams.get('or')?.includes('name.ilike.')){
   const match=url.searchParams.get('or')!.match(/name\.ilike\.("(?:\\.|[^"\\])*")/)
   if(match){const term=(JSON.parse(match[1]) as string).slice(1,-1).replace(/\\(.)/g,'$1').toLocaleLowerCase('pt-BR');result=result.filter(row=>[row.name,row.category,'description' in row?row.description:'','Rogério Silva','colecionador_test'].join(' ').toLocaleLowerCase('pt-BR').includes(term))}
  }
  if(method==='POST'&&table==='collections'){
   const record={...collection,...request.postDataJSON(),id:collectionId}
   state.collections.push(record);result=[record]
  }
  if(method==='PATCH'){
   if(url.searchParams.get('owner_id')!=='eq.'+ownerId)throw new Error('Owner filter missing from update')
   const patch=request.postDataJSON()
   result.forEach(row=>Object.assign(row,patch))
  }
  if(method==='DELETE'){
   if(url.searchParams.get('owner_id')!=='eq.'+ownerId)throw new Error('Owner filter missing from delete')
   if(state.zeroDelete)result=[]
   else{
    const ids=new Set(result.map(row=>row.id))
    if(table==='collections'){state.collections=state.collections.filter(row=>!ids.has(row.id));state.links=state.links.filter(link=>!ids.has(link.collection_id))}
    else{state.items=state.items.filter(row=>!ids.has(row.id));state.links=state.links.filter(link=>!ids.has(link.item_id))}
   }
  }
  const total=result.length
  if(method==='GET')result=paged(result)
  const single=request.headers()['accept']?.includes('vnd.pgrst.object')
  const response=result.map(row=>table==='collections'&&url.searchParams.get('select')?.includes('author:')?{...row,author:{id:ownerId,display_name:'Rogério Silva',username:'colecionador_test'}}:row)
  return route.fulfill({json:single?response[0]:response,headers:{'Content-Range':total?'0-'+(Math.max(0,result.length-1))+'/'+total:'*/0'}})
 })
 return state
}
