import Link from 'next/link'
import {UserRound} from 'lucide-react'
import {BrandLogo} from '@/components/brand-logo'
import {HomeDashboard} from '@/components/home-dashboard'
import {MobileNav} from '@/components/mobile-nav'
export default function HomePage(){return <main className="app-frame">
 <header className="topbar home-topbar"><BrandLogo/><Link href="/perfil" className="home-profile-shortcut" aria-label="Abrir perfil"><UserRound size={23}/></Link></header>
 <HomeDashboard/><MobileNav active="inicio"/></main>}
