'use client'
import {useState,type ReactNode} from 'react'
import {Check,Copy,Mail,MessageCircle,Send,Share2,X} from 'lucide-react'
import {Modal} from './modal'

type Props={title:string;text?:string;path:string;label?:string;className?:string;icon?:ReactNode;children?:ReactNode}

/**
 * Opens the phone's own share sheet (WhatsApp, Instagram, copy link…).
 * Browsers without it get an equivalent sheet inside the app.
 */
export function ShareButton({title,text,path,label='Compartilhar',className='share-button',icon,children}:Props){
 const [sheet,setSheet]=useState(false)
 const [copied,setCopied]=useState(false)
 const url=()=>(typeof window==='undefined'?'':window.location.origin)+path
 async function share(){
  const data={title,text:text||title,url:url()}
  if(typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare(data))){
   try{await navigator.share(data);return}
   catch(error){if(error instanceof DOMException&&error.name==='AbortError')return}
  }
  setCopied(false);setSheet(true)
 }
 async function copy(){
  try{await navigator.clipboard.writeText(url());setCopied(true)}
  catch{(document.getElementById('share-sheet-link') as HTMLInputElement|null)?.select()}
 }
 const message=encodeURIComponent((text||title)+' '+url())
 return <>
  <button type="button" className={className} onClick={()=>void share()}>{icon??<Share2 size={17} aria-hidden="true"/>}{children??<span>{label}</span>}</button>
  {sheet&&<Modal label={'Compartilhar '+title} onClose={()=>setSheet(false)} initialFocus=".share-copy">
   <section className="edit-modal share-sheet">
    <button type="button" className="close-modal" aria-label="Fechar" onClick={()=>setSheet(false)}><X size={20}/></button>
    <h2>Compartilhar</h2>
    <p className="share-sheet-title">{title}</p>
    <label className="share-sheet-link"><span className="visually-hidden">Link</span><input id="share-sheet-link" readOnly value={url()} onFocus={e=>e.currentTarget.select()}/></label>
    <button type="button" className="share-copy save-item-button" onClick={()=>void copy()}>{copied?<><Check size={18}/> Link copiado!</>:<><Copy size={18}/> Copiar link</>}</button>
    <div className="share-sheet-apps">
     <a href={'https://wa.me/?text='+message} target="_blank" rel="noopener noreferrer"><MessageCircle size={20}/>WhatsApp</a>
     <a href={'https://t.me/share/url?url='+encodeURIComponent(url())+'&text='+encodeURIComponent(text||title)} target="_blank" rel="noopener noreferrer"><Send size={20}/>Telegram</a>
     <a href={'mailto:?subject='+encodeURIComponent(title)+'&body='+message}><Mail size={20}/>E-mail</a>
    </div>
   </section>
  </Modal>}
 </>
}
