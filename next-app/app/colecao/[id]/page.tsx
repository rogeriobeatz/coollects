'use client'
import { useParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicCollection } from '@/components/public-collection'
export default function CollectionDetailPage(){
 const {id}=useParams<{id:string}>()
 return <Screen backHref="/colecoes" active="colecoes" title="Sua coleção," accent="seus itens." subtitle="Organize, adicione e compartilhe."><PublicCollection id={id}/></Screen>
}
