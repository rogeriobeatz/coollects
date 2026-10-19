import type { Metadata } from 'next'
import { CollectionDetailScreen } from '@/components/collection-detail-screen'
import { collectionPreview } from '@/lib/og'

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params
 const data=await collectionPreview(id)
 if(!data)return {title:'Coleção',robots:{index:false}}
 const description=data.description.trim()||('Coleção'+(data.owner?' de '+data.owner:'')+' com '+data.count+' '+(data.count===1?'item':'itens')+' no Coollects.')
 return {title:data.name,description,openGraph:{title:data.name,description,type:'website',siteName:'Coollects',locale:'pt_BR'},twitter:{card:'summary_large_image',title:data.name,description}}
}

export default function CollectionDetailPage(){return <CollectionDetailScreen/>}
