import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { PublicProfile } from '@/components/public-profile'
import { profilePreview } from '@/lib/og'

function normalize(value:string){
 try{return decodeURIComponent(value).trim().toLowerCase()}catch{return value.toLowerCase()}
}

export async function generateMetadata({params}:{params:Promise<{username:string}>}):Promise<Metadata>{
 const username=normalize((await params).username)
 const data=await profilePreview(username)
 if(!data)return {title:'Colecionador',robots:{index:false}}
 const title=data.name+' (@'+data.username+')'
 const description=data.bio.trim()||('Coleções de '+data.name+' no Coollects: '+data.items+' '+(data.items===1?'item':'itens')+' e '+data.followers+' '+(data.followers===1?'seguidor':'seguidores')+'.')
 return {title,description,openGraph:{title,description,type:'profile',siteName:'Coollects',locale:'pt_BR'},twitter:{card:'summary_large_image',title,description}}
}

export default async function CollectorPage({params}:{params:Promise<{username:string}>}){
 const username=normalize((await params).username)
 return <Screen active="explorar" backHref="/explorar" title="" subtitle="" compact><PublicProfile username={username}/></Screen>
}
