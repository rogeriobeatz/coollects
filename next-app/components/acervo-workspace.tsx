'use client'
import {useSearchParams} from 'next/navigation'
import {useEffect,useState} from 'react'
import {ItemLibrary} from './item-library'
import {CollectionWorkspace} from './collection-workspace'
export function AcervoWorkspace(){
 const params=useSearchParams()
 const [section,setSection]=useState<'itens'|'colecoes'>(params.get('aba')==='colecoes'?'colecoes':'itens')
 useEffect(()=>{setSection(params.get('aba')==='colecoes'?'colecoes':'itens')},[params])
 return <section className="acervo-workspace">
  <div className="acervo-switch" role="group" aria-label="Seção do acervo">
   <button type="button" aria-pressed={section==='itens'} onClick={()=>setSection('itens')}>Itens</button>
   <button type="button" aria-pressed={section==='colecoes'} onClick={()=>setSection('colecoes')}>Coleções</button>
  </div>
  {section==='itens'?<ItemLibrary/>:<CollectionWorkspace/>}
 </section>
}
