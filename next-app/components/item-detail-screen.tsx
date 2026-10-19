'use client'
import {useParams,useSearchParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'
export default function ItemDetailPage(){
 const {id}=useParams<{id:string}>()
 const params=useSearchParams()
 const context=params.get('voltar')
 const fromExplore=params.get('origem')==='explorar'
 const backHref=context&&/^colecao\/[0-9a-f-]{36}$/i.test(context)?'/'+context:'/itens'
 return <Screen backHref={backHref} active={fromExplore?"explorar":backHref.startsWith('/colecao/')?"colecoes":"itens"} title="" subtitle="" compact><ItemShowcase id={id}/></Screen>
}
