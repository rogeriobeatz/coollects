'use client'
import {useState} from 'react'
import {ChevronLeft,ChevronRight,X} from 'lucide-react'
import {Modal} from './modal'

/** Extra photos of an item: a thumbnail strip that opens a simple viewer. */
export function ItemGallery({name,urls}:{name:string;urls:string[]}){
 const [open,setOpen]=useState<number|null>(null)
 if(!urls.length)return null
 const step=(delta:number)=>setOpen(i=>i===null?i:(i+delta+urls.length)%urls.length)
 return <section className="item-gallery" aria-label="Mais fotos">
  <h2>Mais fotos <span>{urls.length}</span></h2>
  <div className="item-gallery-strip">{urls.map((url,i)=><button type="button" key={url} onClick={()=>setOpen(i)} aria-label={'Ampliar foto '+(i+1)+' de '+urls.length}><img src={url} alt="" loading="lazy"/></button>)}</div>
  {open!==null&&<Modal label={'Foto '+(open+1)+' de '+urls.length+' — '+name} onClose={()=>setOpen(null)}>
   <div className="item-gallery-viewer" onKeyDown={e=>{if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)}}>
    <button type="button" className="close-modal" aria-label="Fechar" onClick={()=>setOpen(null)}><X size={18}/></button>
    <img src={urls[open]} alt={'Foto '+(open+1)+' de '+name}/>
    {urls.length>1&&<div className="item-gallery-nav"><button type="button" onClick={()=>step(-1)} aria-label="Foto anterior"><ChevronLeft size={22}/></button><span>{open+1} / {urls.length}</span><button type="button" onClick={()=>step(1)} aria-label="Próxima foto"><ChevronRight size={22}/></button></div>}
   </div>
  </Modal>}
 </section>
}
