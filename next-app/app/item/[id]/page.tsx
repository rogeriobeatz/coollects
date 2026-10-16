'use client'
import {useParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'
export default function ItemDetailPage(){
 const {id}=useParams<{id:string}>()
 return <Screen backHref="/itens" active="colecoes" title="Cada peça," accent="uma história." subtitle="Os detalhes que fazem sua coleção única."><ItemShowcase id={id}/></Screen>
}
