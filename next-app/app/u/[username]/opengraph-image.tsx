import { profileImage,OG_SIZE } from '@/lib/og'

export const alt='Perfil no Coollects'
export const size=OG_SIZE
export const contentType='image/png'
// Previews change when the profile changes; regenerate at most every 10 min.
export const revalidate=600

export default async function Image({params}:{params:Promise<{username:string}>}){
 const {username}=await params
 let value=username
 try{value=decodeURIComponent(username)}catch{/* keep the raw segment */}
 return profileImage(value.trim().toLowerCase())
}
