'use client'
import { useParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicCollection } from '@/components/public-collection'
export default function CollectionDetailPage(){
 const {id}=useParams<{id:string}>()
 return <Screen active="explorar" title="Uma coleção," accent="mil histórias." subtitle="Entre, conheça e descubra."><PublicCollection id={id}/></Screen>
}
