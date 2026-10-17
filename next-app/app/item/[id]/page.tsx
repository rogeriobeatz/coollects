'use client'
import {useParams,useSearchParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'
export default function ItemDetailPage(){
 const {id}=useParams<{id:string}>()
 const context=useSearchParams().get('voltar')
 const backHref=context&&/^colecao\/[0-9a-f-]{36}$/i.test(context)?'/'+context:'/itens'
 return <Screen backHref={backHref} active="colecoes" title="" subtitle="" compact><ItemShowcase id={id}/></Screen>
}
