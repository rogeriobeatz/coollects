'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicCollection } from '@/components/public-collection'
import { GuestSharedShell } from '@/components/guest-shared-shell'
import { useAccount } from '@/hooks/use-account'
export default function CollectionDetailPage(){
 const {id}=useParams<{id:string}>()
 const origin=useSearchParams().get('origem')
 const fromExplore=origin==='explorar'
 const {user,loading}=useAccount()
 const content=<PublicCollection id={id}/>
 if(loading)return <main className="guest-shared-loading" role="status">Abrindo coleção…</main>
 if(!user)return <GuestSharedShell returnTo={'/colecao/'+encodeURIComponent(id)+(fromExplore?'?origem=explorar':'')}>{content}</GuestSharedShell>
 return <Screen compact backHref={fromExplore?"/explorar":"/colecoes"} active={fromExplore?"explorar":"colecoes"} title="Coleção" subtitle="">{content}</Screen>
}
