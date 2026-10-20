'use client'
import {useCallback,useEffect,useState} from 'react'
import {Heart,UserPlus,UserCheck} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import {useAccount} from '@/hooks/use-account'

export function SocialProfileStats({profileId}:{profileId:string}){
 const {user}=useAccount()
 const [followers,setFollowers]=useState(0),[likes,setLikes]=useState(0)
 const [following,setFollowing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  const [{data:counts,error:countError},{data:relation}]=await Promise.all([
   db.rpc('social_profile_counts',{p_user_id:profileId}),
   user?db.from('user_follows').select('follower_id').eq('follower_id',user.id).eq('followed_id',profileId).maybeSingle():Promise.resolve({data:null})
  ])
  if(countError){setError('Os indicadores sociais ainda não estão disponíveis.');return}
  const count=Array.isArray(counts)?counts[0]:counts
  setFollowers(Number(count?.followers??0));setLikes(Number(count?.total_likes??0))
  setFollowing(Boolean(relation))
 },[profileId,user])
 useEffect(()=>{void refresh()},[refresh])
 async function toggle(){
  if(!user||user.id===profileId||busy)return
  const db=getBrowserClient();if(!db)return
  setBusy(true);setError('')
  const result=following
   ?await db.from('user_follows').delete().eq('follower_id',user.id).eq('followed_id',profileId)
   :await db.from('user_follows').insert({follower_id:user.id,followed_id:profileId})
  if(result.error)setError('Não foi possível atualizar a conexão.')
  else await refresh()
  setBusy(false)
 }
 return <div className="social-profile-stats">
  <div style={{display:'flex',gap:28,justifyContent:'center',margin:'16px 0'}}>
   <div><strong style={{fontSize:25,display:'block'}}>{followers}</strong><span>seguidores</span></div>
   <div><strong style={{fontSize:25,display:'block'}}>{likes}</strong><span>curtidas</span></div>
  </div>
  {user&&user.id!==profileId&&<button className="pill-btn" type="button" disabled={busy} onClick={()=>void toggle()}>{following?<><UserCheck size={17}/> Seguindo</>:<><UserPlus size={17}/> Seguir</>}</button>}
  {error&&<p role="alert" className="scan-notice">{error}</p>}
 </div>
}

export function ItemLike({itemId,ownerId}:{itemId:string;ownerId:string}){
 const {user}=useAccount()
 const [count,setCount]=useState(0),[liked,setLiked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(async()=>{
  const db=getBrowserClient();if(!db)return
  const [{count:total,error:readError},{data:mine}]=await Promise.all([
   db.from('item_likes').select('item_id',{head:true,count:'exact'}).eq('item_id',itemId),
   user?db.from('item_likes').select('item_id').eq('item_id',itemId).eq('user_id',user.id).maybeSingle():Promise.resolve({data:null})
  ])
  if(readError){setError('Curtidas indisponíveis.');return}
  setCount(total??0);setLiked(Boolean(mine))
 },[itemId,user])
 useEffect(()=>{void refresh()},[refresh])
 async function toggle(){
  if(!user||busy||user.id===ownerId)return
  const db=getBrowserClient();if(!db)return
  setBusy(true);setError('')
  const result=liked?await db.from('item_likes').delete().eq('item_id',itemId).eq('user_id',user.id):await db.from('item_likes').insert({item_id:itemId,user_id:user.id})
  if(result.error)setError('Não foi possível atualizar a curtida.')
  else await refresh()
  setBusy(false)
 }
 return <div style={{margin:'14px 0'}}>
  <button type="button" className="pill-btn" onClick={()=>void toggle()} disabled={!user||user.id===ownerId||busy} aria-pressed={liked} title={!user?'Entre para curtir':user.id===ownerId?'Você não pode curtir seu próprio item':undefined}><Heart size={18} fill={liked?'currentColor':'none'}/>{count} {count===1?'curtida':'curtidas'}</button>
  {error&&<p role="alert" className="scan-notice">{error}</p>}
 </div>
}
