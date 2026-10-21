'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicCollection } from '@/components/public-collection'
import {useAccount} from '@/hooks/use-account'
export function CollectionDetailScreen(){
 const {id}=useParams<{id:string}>()
 const origin=useSearchParams().get('origem')
 const {user}=useAccount()
 const fromExplore=origin==='explorar'||!user
 return <Screen compact backHref={fromExplore?"/explorar":"/colecoes"} active={fromExplore?"explorar":"colecoes"} title="Coleção" subtitle=""><PublicCollection id={id}/></Screen>
}
