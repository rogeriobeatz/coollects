'use client'
import {useParams,useSearchParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'
import {useAccount} from '@/hooks/use-account'

/** Only known local contexts are accepted as the back destination. */
function backTarget(context:string|null,signedIn:boolean){
 if(context&&/^colecao\/[0-9a-f-]{36}$/i.test(context))return '/'+context
 if(context&&/^u\/[a-z0-9_]{3,30}$/.test(context))return '/'+context
 if(context==='inicio')return '/'
 return signedIn?'/itens':'/explorar'
}

export function ItemDetailScreen(){
 const {id}=useParams<{id:string}>()
 const params=useSearchParams()
 const {user}=useAccount()
 const backHref=backTarget(params.get('voltar'),Boolean(user))
 const area=backHref==='/'?'inicio':backHref==='/explorar'||params.get('origem')==='explorar'||backHref.startsWith('/u/')?'explorar':backHref.startsWith('/colecao/')?'colecoes':'itens'
 return <Screen backHref={backHref} active={area} title="" subtitle="" compact><ItemShowcase id={id}/></Screen>
}
