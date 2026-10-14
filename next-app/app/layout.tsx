import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import { PwaRegister } from '@/components/pwa-register'
import { LaunchHold } from '@/components/launch-hold'
import { supabaseConfig } from '@/lib/supabase/config'
import './globals.css'

export const metadata: Metadata = {
 title: { default: 'Coollects — Suas coleções em um só lugar', template: '%s | Coollects' },
 description: 'Digitalize, organize, descubra e compartilhe suas coleções.',
 applicationName: 'Coollects',
 manifest: '/manifest.webmanifest',
 icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], apple: [{ url: '/brand/coollects.png' }] },
 appleWebApp: { capable: true, title: 'Coollects', statusBarStyle: 'default' }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#6125BF' }

// Never allow half-configured production to show broken onboarding or CRUD forms.
// Evaluated per request so server-only Vercel settings are never baked into a static build.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 await connection()
 const ready = process.env.COOLLECTS_SITE_MODE === 'open' && Boolean(supabaseConfig())
 return <html lang="pt-BR"><body>{ready ? <>{children}<PwaRegister/></> : <LaunchHold/>}</body></html>
}
