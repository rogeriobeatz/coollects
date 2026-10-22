'use client'
import {useState,type FormEvent} from 'react'
import {getBrowserClient} from '@/lib/supabase/client'
import {Check,Phone} from 'lucide-react'

/** Brazilian mobile number; saved only as a registration field, never as marketing opt-in. */
export function normalizeBrazilianMobile(input:string):string|null{
 const digits=input.replace(/\D/g,'')
 const national=digits.startsWith('55')&&digits.length===13?digits.slice(2):digits
 return /^[1-9][0-9]9[0-9]{8}$/.test(national)?'+55'+national:null
}

export function PhoneRegistration({userId,onSaved,compact=false}:{userId:string;onSaved?:()=>void;compact?:boolean}){
 const [phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault()
  const number=normalizeBrazilianMobile(phone)
  if(!number){setMessage('Informe um celular brasileiro válido com DDD: (11) 99999-9999.');return}
  const db=getBrowserClient()
  if(!db){setMessage('Sem conexão com o cadastro. Tente novamente.');return}
  setBusy(true);setMessage('')
  try{
   const {error}=await db.from('user_contact_numbers').upsert({user_id:userId,phone_e164:number},{onConflict:'user_id'})
   if(error)throw error
   setMessage('Celular cadastrado com sucesso!')
   onSaved?.()
  }catch{setMessage('Não foi possível salvar o celular. Tente novamente.')}
  finally{setBusy(false)}
 }
 return <form className={'phone-registration'+(compact?' phone-registration-compact':'')} onSubmit={e=>void save(e)}>
  <label className="field-label">Seu celular (WhatsApp)
   <input type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999"/>
  </label>
  <p className="phone-registration-note">Usaremos este número apenas como informação cadastral. Você não está autorizando mensagens ou publicidade. O celular não aparece no seu perfil público.</p>
  <button className="save-item-button" disabled={busy} type="submit"><Phone size={18}/>{busy?'Salvando…':'Salvar meu celular'}</button>
  {message&&<p role="status" className="scan-notice">{message}</p>}
 </form>
}
