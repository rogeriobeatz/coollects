'use client'
import { useEffect,useState,type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle,Trash2,X } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/client'
export function AccountDeletion(){
 const [email,setEmail]=useState('')
 const [open,setOpen]=useState(false)
 const [password,setPassword]=useState('')
 const [confirmation,setConfirmation]=useState('')
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [totals,setTotals]=useState<{items:number;collections:number}|null>(null)
 const router=useRouter()
 useEffect(()=>{const db=getBrowserClient();if(!db)return;void db.auth.getUser().then(async({data})=>{setEmail(data.user?.email||'');if(!data.user)return;const [items,collections]=await Promise.all([db.from('items').select('id',{head:true,count:'exact'}).eq('owner_id',data.user.id),db.from('collections').select('id',{head:true,count:'exact'}).eq('owner_id',data.user.id)]);if(!items.error&&!collections.error)setTotals({items:items.count??0,collections:collections.count??0})})},[])
 async function submit(event:FormEvent){
  event.preventDefault()
  if(busy||confirmation!=='EXCLUIR'||!password)return
  const db=getBrowserClient();if(!db)return
  setBusy(true);setMessage('')
  try{
   const {error:loginError}=await db.auth.signInWithPassword({email,password})
   if(loginError)throw new Error('Confira sua senha e tente novamente.')
   const {data,error}=await db.functions.invoke('delete-account',{body:{confirmation:'EXCLUIR',email}})
   if(error||!data?.success)throw new Error('Não conseguimos excluir a conta agora. Tente novamente mais tarde.')
   await db.auth.signOut()
   router.replace('/');router.refresh()
  }catch(e){
   setMessage(e instanceof Error?e.message:'Não foi possível concluir a solicitação.')
   setPassword('')
  }finally{setBusy(false)}
 }
 return <section className="account-danger">
  <h3>Controle da conta</h3>
  <p>Você pode solicitar a exclusão permanente da sua conta, das coleções e das fotografias salvas. Essa ação não pode ser desfeita.</p>
  <button className="account-delete-button" onClick={()=>{setMessage('');setOpen(true)}}><Trash2 size={17}/> Excluir minha conta</button>
  {open&&<div className="edit-overlay" role="dialog" aria-modal="true" aria-label="Excluir conta"><section className="edit-modal">
    <button type="button" className="close-modal" onClick={()=>{if(!busy){setOpen(false);setPassword('');setConfirmation('')}}} aria-label="Cancelar exclusão"><X size={20}/></button>
    <span className="account-warn-icon"><AlertTriangle size={28}/></span>
    <h2>Excluir sua conta?</h2>
    <p>{totals?('Isso apagará '+totals.items+' '+(totals.items===1?'item':'itens')+', '+totals.collections+' '+(totals.collections===1?'coleção':'coleções')+' e todas as fotos.'): 'Suas coleções, itens e fotografias serão removidos permanentemente.'} Não dá para desfazer. Para confirmar, digite EXCLUIR e informe sua senha.</p>
    <form onSubmit={e=>void submit(e)}>
     <label className="field-label">Confirme sua senha<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label className="field-label">Digite EXCLUIR<input type="text" autoComplete="off" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="EXCLUIR"/></label>
     <button type="submit" className="account-delete-button" disabled={busy||confirmation!=='EXCLUIR'||!password}>{busy?'Excluindo…':'Excluir definitivamente'}</button>
    </form>
    {message&&<p role="alert" className="scan-notice">{message}</p>}
   </section></div>}
 </section>
}
