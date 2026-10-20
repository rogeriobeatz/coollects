import type { Metadata, Viewport } from 'next'
import { PwaRegister } from '@/components/pwa-register'
import { ItemPresentationProvider } from '@/components/item-presentation-provider'
import './globals.css'
import './item-cards.css'

// Absolute base for link previews; on Vercel the production URL is used automatically.
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
 metadataBase: siteUrl ? new URL(siteUrl) : undefined,
 title: { default: 'Coollects — Suas coleções em um só lugar', template: '%s | Coollects' },
 description: 'Digitalize, organize, descubra e compartilhe suas coleções.',
 applicationName: 'Coollects',
 manifest: '/manifest.webmanifest',
 icons: {
  icon: [
   { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
   { url: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' }
  ],
  apple: [{ url: '/brand/icon-180.png', sizes: '180x180', type: 'image/png' }]
 },
 appleWebApp: { capable: true, title: 'Coollects', statusBarStyle: 'black-translucent' }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#6125BF' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="pt-BR" data-scroll-behavior="smooth"><head><meta name="apple-mobile-web-app-capable" content="yes" /></head><body><ItemPresentationProvider>{children}</ItemPresentationProvider><PwaRegister/></body></html>
}
