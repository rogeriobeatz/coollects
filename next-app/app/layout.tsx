import type { Metadata, Viewport } from 'next'
import { PwaRegister } from '@/components/pwa-register'
import { ItemPresentationProvider } from '@/components/item-presentation-provider'
import './globals.css'
import './item-cards.css'

export const metadata: Metadata = {
 title: { default: 'Coollects — Suas coleções em um só lugar', template: '%s | Coollects' },
 description: 'Digitalize, organize, descubra e compartilhe suas coleções.',
 applicationName: 'Coollects',
 manifest: '/manifest.webmanifest',
 icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], apple: [{ url: '/brand/coollects.png' }] },
 appleWebApp: { capable: true, title: 'Coollects', statusBarStyle: 'black-translucent' }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#6125BF' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="pt-BR" data-scroll-behavior="smooth"><head><meta name="apple-mobile-web-app-capable" content="yes" /></head><body><ItemPresentationProvider>{children}</ItemPresentationProvider><PwaRegister/></body></html>
}
