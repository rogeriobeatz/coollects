import { BrandLogo } from '@/components/brand-logo'
import { HomeDashboard } from '@/components/home-dashboard'
import { MobileNav } from '@/components/mobile-nav'
export default function HomePage(){
 return <main className="app-frame"><header className="topbar home-topbar"><BrandLogo/><span className="topbar-circle" aria-hidden="true">✳</span></header><HomeDashboard/><MobileNav active="inicio"/></main>
}
