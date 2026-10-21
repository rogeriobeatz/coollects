'use client'
import {useParams,useSearchParams} from 'next/navigation'
import {Screen} from '@/components/screen'
import {ItemShowcase} from '@/components/item-showcase'

/** Only known local contexts are accepted as the back destination. */
function backTarget(context:string|null){
 if(context&&/^colecao\/[0-9a-f-]{36}$/i.test(context))return '/'+context
 if(context&&/^u\/[a-z0-9_]{3,30}$/.test(context))return '/'+context
 if(context==='inicio')return '/'
 return '/itens'
}

export function ItemDetailScreen(){
 const {id}=useParams<{id:string}>()
 const params=useSearchParams()
 const backHref=backTarget(params.get('voltar'))
 const area=backHref==='/'?'inicio':params.get('origem')==='explorar'||backHref.startsWith('/u/')?'explorar':backHref.startsWith('/colecao/')?'colecoes':'itens'
 return <Screen backHref={backHref} active={area} title="" subtitle="" compact><ItemShowcase id={id}/></Screen>
}
