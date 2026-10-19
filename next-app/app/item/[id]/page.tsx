import type { Metadata } from 'next'
import { ItemDetailScreen } from '@/components/item-detail-screen'
import { itemPreview } from '@/lib/og'

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params
 const data=await itemPreview(id)
 if(!data)return {title:'Item',robots:{index:false}}
 const description=[[data.brand,data.series].filter(Boolean).join(' · '),data.owner?'Do acervo de '+data.owner+' no Coollects.':'No Coollects.'].filter(Boolean).join(' — ')
 return {title:data.name,description,openGraph:{title:data.name,description,type:'website',siteName:'Coollects',locale:'pt_BR'},twitter:{card:'summary_large_image',title:data.name,description}}
}

export default function ItemDetailPage(){return <ItemDetailScreen/>}
