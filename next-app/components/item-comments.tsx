'use client'
import {useCallback,useEffect,useState,type FormEvent} from 'react'
import Link from 'next/link'
import {MessageCircle,Send,Trash2} from 'lucide-react'
import {getBrowserClient} from '@/lib/supabase/client'
import {publicUrlPath} from '@/lib/catalog'
import {relativeTime,signInHref} from '@/lib/social'
import {CollectorAvatar} from './collector-avatar'
import {useAccount} from '@/hooks/use-account'
import {usePathname} from 'next/navigation'

type Comment={id:string;item_id:string;author_id:string;body:string;created_at:string;profiles?:{username:string;display_name:string}|null}
const PAGE=20
export function ItemComments({itemId,ownerId}:{itemId:string;ownerId:string}){
 const {user}=useAccount()
 const path=usePathname()
 const [comments,setComments]=useState<Comment[]>([])
 const [draft,setDraft]=useState('')
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [hasMore,setHasMore]=useState(false),[page,setPage]=useState(0)
 const load=useCallback(async(offset=0)=>{
  const db=getBrowserClient();if(!db){setError('Serviço indisponível.');setLoading(false);return}
  setLoading(true);setError('')
  try{
   const {data,error:readError}=await db.from('item_comments').select('id,item_id,author_id,body,created_at').eq('item_id',itemId).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+PAGE)
   if(readError)throw readError
   const rows=(data||[]) as Comment[]
   const ids=[...new Set(rows.map(row=>row.author_id))]
   let profiles=new Map<string,{username:string;display_name:string}>()
   if(ids.length){
    const {data:authors,error:authorError}=await db.from('profiles').select('id,username,display_name').in('id',ids)
    if(authorError)throw authorError
    profiles=new Map((authors||[]).map(a=>[a.id,{username:a.username,display_name:a.display_name}]))
   }
   const decorated=rows.slice(0,PAGE).map(row=>({...row,profiles:profiles.get(row.author_id)||null}))
   setComments(old=>offset?[...old,...decorated.filter(row=>!old.some(prev=>prev.id===row.id))]:decorated)
   setHasMore(rows.length>PAGE);setPage(offset+decorated.length)
  }catch{setError('Não foi possível carregar os comentários.')}
  finally{setLoading(false)}
 },[itemId])
 useEffect(()=>{void load(0)},[load])
 async function post(e:FormEvent){
  e.preventDefault()
  const body=draft.trim()
  if(!user||!body||body.length>280||busy)return
  const db=getBrowserClient();if(!db)return
  setBusy(true);setError('')
  try{
   const {error:saveError}=await db.from('item_comments').insert({item_id:itemId,author_id:user.id,body})
   if(saveError)throw saveError
   setDraft('');await load(0)
  }catch{setError('Não foi possível publicar. Aguarde alguns segundos e tente novamente.')}
  finally{setBusy(false)}
 }
 async function remove(commentId:string){
  if(!user||busy||!window.confirm('Excluir este comentário?'))return
  const db=getBrowserClient();if(!db)return
  setBusy(true);setError('')
  try{
   const {error:deleteError}=await db.from('item_comments').delete().eq('id',commentId)
   if(deleteError)throw deleteError
   setComments(old=>old.filter(row=>row.id!==commentId))
  }catch{setError('Não foi possível excluir o comentário.')}
  finally{setBusy(false)}
 }
 return <section className="item-comments" aria-labelledby="item-comments-title">
  <div className="item-comments-header"><MessageCircle size={20}/><h2 id="item-comments-title">Comentários</h2></div>
  {user?<form className="item-comments-form" onSubmit={e=>void post(e)}>
   <label htmlFor={'comment-'+itemId} className="visually-hidden">Escreva um comentário</label>
   <textarea id={'comment-'+itemId} rows={2} maxLength={280} placeholder="O que achou dessa peça?" value={draft} onChange={e=>setDraft(e.target.value)}/>
   <div className="item-comments-form-actions"><small>{draft.length}/280</small><button type="submit" disabled={busy||!draft.trim()}><Send size={16}/> {busy?'Publicando…':'Comentar'}</button></div>
  </form>:<p className="item-comments-signin"><Link href={signInHref(path)}>Entre na sua conta</Link> para participar da conversa.</p>}
  {error&&<p className="profile-inline-error" role="alert">{error} <button type="button" onClick={()=>void load(0)}>Tentar novamente</button></p>}
  <div className="item-comments-list">
   {comments.map(comment=>{
    const author=comment.profiles
    const name=author?.display_name||'Colecionador'
    return <article className="item-comment" key={comment.id}>
     <CollectorAvatar name={name} seed={comment.author_id} size="sm"/>
     <div className="item-comment-content">
      <div className="item-comment-top">{author?<Link href={publicUrlPath(author.username)}><strong>{name}</strong></Link>:<strong>{name}</strong>}<time dateTime={comment.created_at}>{relativeTime(comment.created_at)}</time></div>
      <p>{comment.body}</p>
     </div>
     {(user?.id===comment.author_id||user?.id===ownerId)&&<button className="item-comment-delete" aria-label={'Excluir comentário de '+name} title="Excluir comentário" disabled={busy} onClick={()=>void remove(comment.id)}><Trash2 size={16}/></button>}
    </article>
   })}
   {!loading&&!comments.length&&!error&&<p className="item-comments-empty">Ainda não há comentários. Comece a conversa!</p>}
   {loading&&<p className="item-comments-empty" role="status">Carregando comentários…</p>}
  </div>
  {hasMore&&!loading&&<button className="item-comments-more" onClick={()=>void load(page)}>Ver mais comentários</button>}
 </section>
}
