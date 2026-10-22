'use client'
import {useCallback,useEffect,useState,type ReactNode} from 'react'
import Link from 'next/link'
import {getBrowserClient} from '@/lib/supabase/client'
import {CATALOG_CHANGED} from '@/lib/catalog'
import {PhoneRegistration} from './phone-registration'
import {Phone,RefreshCw} from 'lucide-react'

/** Existing items remain accessible; only creating the next item is gated. */
export function PhoneCaptureGate({userId,children}:{userId:string;children:ReactNode}){
 const [status,setStatus]=useState<'loading'|'open'|'required'|'error'>('loading')
 const check=useCallback(async()=>{
  const db=getBrowserClient()
  if(!db){setStatus('error');return}
  setStatus('loading')
  try{
   const [{data:phone,error:phoneError},{count,error:itemError}]=await Promise.all([
    db.from('user_contact_numbers').select('user_id').eq('user_id',userId).maybeSingle(),
    db.from('items').select('id',{count:'exact',head:true}).eq('owner_id',userId)
   ])
   if(phoneError||itemError)throw new Error('profile unavailable')
   setStatus(phone||count===0?'open':'required')
  }catch{setStatus('error')}
 },[userId])
 useEffect(()=>{
  void check()
  const refresh=(event:Event)=>{if((event as CustomEvent<string>).detail===userId)void check()}
  window.addEventListener(CATALOG_CHANGED,refresh)
  return()=>window.removeEventListener(CATALOG_CHANGED,refresh)
 },[check,userId])
 if(status==='open')return <>{children}</>
 if(status==='loading')return <div className="phone-gate" role="status">Verificando seu cadastro…</div>
 if(status==='error')return <div className="phone-gate" role="alert"><p>Não conseguimos verificar seus dados cadastrais.</p><button className="pill-btn" onClick={()=>void check()}><RefreshCw size={16}/> Tentar novamente</button></div>
 return <section className="phone-gate" aria-labelledby="phone-gate-title">
  <span className="phone-gate-symbol"><Phone size={24}/></span>
  <h2 id="phone-gate-title">Sua coleção está crescendo!</h2>
  <p>Para cadastrar a próxima peça, precisamos apenas completar seu cadastro com um número de celular.</p>
  <PhoneRegistration userId={userId} onSaved={()=>setStatus('open')}/>
  <Link href="/itens" className="phone-gate-back">Voltar aos meus itens</Link>
 </section>
}
