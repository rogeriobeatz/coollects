import { itemImage,OG_SIZE } from '@/lib/og'

export const alt='Prévia no Coollects'
export const size=OG_SIZE
export const contentType='image/png'
// Previews change when the collection changes; regenerate at most every 10 min.
export const revalidate=600

export default async function Image({params}:{params:Promise<{id:string}>}){
 const {id}=await params
 return itemImage(id)
}
