import type { MetadataRoute } from 'next'
export const dynamic='force-dynamic'
export default function robots():MetadataRoute.Robots {
 return {rules:process.env.COOLLECTS_SITE_MODE==='open'?{userAgent:'*',allow:'/'}:{userAgent:'*',disallow:'/'}}
}
