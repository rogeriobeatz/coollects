'use client'
import {useParams,useSearchParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'
import {GuestSharedShell} from '@/components/guest-shared-shell'
import {useAccount} from '@/hooks/use-account'
export default function ItemDetailPage(){
 const {id}=useParams<{id:string}>()
 const params=useSearchParams()
 const context=params.get('voltar')
 const fromExplore=params.get('origem')==='explorar'
 const {user,loading}=useAccount()
 const backHref=context&&/^colecao\/[0-9a-f-]{36}$/i.test(context)?'/'+context:'/itens'
 const content=<ItemShowcase id={id}/>
 if(loading)return <main className="guest-shared-loading" role="status">Abrindo item…</main>
 if(!user)return <GuestSharedShell returnTo={backHref.startsWith('/colecao/')?backHref:'/item/'+encodeURIComponent(id)}>{content}</GuestSharedShell>
 return <Screen backHref={backHref} active={fromExplore?"explorar":backHref.startsWith('/colecao/')?"colecoes":"itens"} title="" subtitle="" compact>{content}</Screen>
}
