'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicCollection } from '@/components/public-collection'
export default function CollectionDetailPage(){
 const {id}=useParams<{id:string}>()
 const origin=useSearchParams().get('origem')
 const fromExplore=origin==='explorar'
 return <Screen compact backHref={fromExplore?"/explorar":"/colecoes"} active={fromExplore?"explorar":"colecoes"} title="Coleção" subtitle=""><PublicCollection id={id}/></Screen>
}
