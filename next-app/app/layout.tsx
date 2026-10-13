import type { Metadata, Viewport } from 'next'
import './globals.css'
export const metadata: Metadata = {
 title: { default: 'Coollects — Suas coleções em um só lugar', template: '%s | Coollects' },
 description: 'Digitalize, organize, descubra e compartilhe coleções.',
 applicationName: 'Coollects',
 manifest: '/manifest.webmanifest',
 appleWebApp: { capable: true, title: 'Coollects', statusBarStyle: 'default' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#6429d6' }
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
 return <html lang="pt-BR"><body>{children}</body></html>
}
