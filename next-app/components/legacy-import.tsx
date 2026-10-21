'use client'
import { useEffect,useState } from 'react'
import { DownloadCloud } from 'lucide-react'
import { getCollections,getItems } from '@/lib/local-catalog'
import { getBrowserClient } from '@/lib/supabase/client'
import { safeColor } from '@/lib/catalog'
export function LegacyImport({userId}:{userId:string}){
 const [count,setCount]=useState({collections:0,items:0})
 const [importing,setImporting]=useState(false)
 const [done,setDone]=useState(false)
 const [message,setMessage]=useState('')
 const key='coollects.import.completed.'+userId
 useEffect(()=>{
  setCount({collections:getCollections().length,items:getItems().length})
  try{setDone(localStorage.getItem(key)==='true')}catch{}
 },[key])
 async function run(){
  if(!confirm('Copiar coleções e itens antigos deste navegador para sua conta? Seus dados locais serão mantidos. Fotos antigas não foram armazenadas e não podem ser recuperadas.'))return
  const db=getBrowserClient();if(!db)return
  setImporting(true);setMessage('')
  try{
   const collections=getCollections(),items=getItems()
   for(const c of collections){
    const {error}=await db.from('collections').upsert({
     id:c.id,owner_id:userId,name:c.name.slice(0,70),category:c.category.slice(0,50),
     color:safeColor(c.color),description:(c.description||'').slice(0,300),is_public:false
    },{onConflict:'id',ignoreDuplicates:true})
    if(error)throw error
   }
   for(const item of items){
    const {error}=await db.from('items').upsert({
     id:item.id,owner_id:userId,name:item.name.slice(0,90),brand:(item.brand||'').slice(0,70),
     category:(item.category||'Outros').slice(0,50),notes:(item.notes||'').slice(0,300),photo_path:null
    },{onConflict:'id',ignoreDuplicates:true})
    if(error)throw error
    if(item.collectionId && collections.some(c=>c.id===item.collectionId)){
     const {error:linkError}=await db.from('collection_items').upsert({
      collection_id:item.collectionId,item_id:item.id
     },{onConflict:'collection_id,item_id',ignoreDuplicates:true})
     if(linkError)throw linkError
    }
   }
   try{localStorage.setItem(key,'true')}catch{/* Import succeeded even if local preferences are unavailable. */}
   setDone(true)
   setMessage('Dados locais importados! Atualize a página para visualizar seu acervo.')
  }catch(e){setMessage('Não foi possível concluir a importação. Seus dados deste aparelho continuam preservados.')}
  finally{setImporting(false)}
 }
 if(done)return <p className="local-banner">Importação deste navegador concluída. Seus dados locais originais não foram apagados.</p>
 if(!count.collections&&!count.items)return null
 return <div className="legacy-import"><h3>Encontramos dados antigos neste navegador</h3><p>{count.collections} coleções e {count.items} itens da primeira versão local. Você pode importá-los para sua conta.</p><button className="pill-btn" disabled={importing} onClick={()=>void run()}><DownloadCloud size={18}/>{importing?'Importando…':'Importar dados locais'}</button>{message&&<p role="status">{message}</p>}</div>
}
