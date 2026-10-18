'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {ArrowRight,Settings,Share2,UserRound,Camera} from 'lucide-react'
import {AuthGate} from './auth-gate'
import {getBrowserClient} from '@/lib/supabase/client'
import {publicUrlPath,type ProfileRow} from '@/lib/catalog'
export function ProfileWorkspace(){return <AuthGate>{userId=><ProfileOverview userId={userId}/>}</AuthGate>}
function ProfileOverview({userId}:{userId:string}){
 const [profile,setProfile]=useState<ProfileRow|null>(null)
 const [collections,setCollections]=useState(0)
 const [items,setItems]=useState(0)
 const [message,setMessage]=useState('')
 useEffect(()=>{let mounted=true;const db=getBrowserClient();if(!db)return
  void (async()=>{
   const [{data:p,error},total]=await Promise.all([db.from('profiles').select('*').eq('id',userId).single(),db.from('collections').select('id',{count:'exact',head:true}).eq('owner_id',userId).eq('is_public',true)])
   if(error){if(mounted)setMessage('Não foi possível carregar o perfil.');return}
   const {data:cols}=await db.from('collections').select('id').eq('owner_id',userId).eq('is_public',true)
   const ids=(cols||[]).map(c=>c.id)
   const {data:links}=ids.length?await db.from('collection_items').select('item_id').in('collection_id',ids):{data:[] as {item_id:string}[]}
   if(mounted){setProfile(p as ProfileRow);setCollections(total.count??0);setItems(new Set((links||[]).map(x=>x.item_id)).size)}
  })()
  return ()=>{mounted=false}
 },[userId])
 async function share(){if(!profile)return;try{await navigator.clipboard.writeText(location.origin+publicUrlPath(profile.username));setMessage('Link copiado!')}catch{setMessage('Não foi possível copiar. Tente novamente.')}}
 if(!profile)return <p className="ux-loading" role="status">{message||'Carregando perfil…'}</p>
 const avatar=profile.avatar_path?getBrowserClient()?.storage.from('coollects-avatars').getPublicUrl(profile.avatar_path).data.publicUrl:null
 return <section className="ux-profile">
  <div className="ux-profile-head"><Link href="/perfil/editar" className="ux-profile-avatar" aria-label="Alterar foto do perfil">{avatar?<img alt="" src={avatar}/>:<UserRound size={38}/>}<Camera size={17} className="ux-avatar-camera"/></Link>
   <div><h1>{profile.display_name}</h1><p>@{profile.username}</p></div></div>
  {profile.bio&&<p className="ux-profile-bio">{profile.bio}</p>}
  <div className="ux-profile-stats"><span><strong>{collections}</strong> {collections===1?'coleção pública':'coleções públicas'}</span><span><strong>{items}</strong> {items===1?'item público':'itens públicos'}</span></div>
  <div className="ux-profile-actions"><Link href="/perfil/editar" className="ux-secondary">Editar perfil</Link><button type="button" className="ux-secondary" onClick={()=>void share()} aria-label="Copiar link do perfil"><Share2 size={18}/> Compartilhar</button></div>
  {message&&<p role="status" className="scan-notice">{message}</p>}
  <Link className="ux-profile-row" href={publicUrlPath(profile.username)}>Ver perfil público <ArrowRight size={19}/></Link>
  <Link className="ux-profile-row" href="/configuracoes"><Settings size={19}/> Configurações <ArrowRight size={19}/></Link>
  <p className="ux-privacy-hint">Somente suas coleções públicas aparecem para outros colecionadores.</p>
 </section>
}
