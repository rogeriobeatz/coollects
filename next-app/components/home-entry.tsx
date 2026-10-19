'use client'

import { AppHeader } from './app-header'
import { useAccount } from '@/hooks/use-account'
import { BrandLogo } from './brand-logo'
import { HomeDashboard } from './home-dashboard'
import { MobileNav } from './mobile-nav'
import { WelcomeScreen } from './welcome-screen'

export function HomeEntry() {
 const { user, loading } = useAccount()

 if (loading) return <main className="app-frame home-loading" aria-busy="true">
  <BrandLogo/>
  <p role="status">Abrindo seu universo…</p>
 </main>

 if (!user) return <WelcomeScreen/>

 return <main className="app-frame">
  <AppHeader/>
  <HomeDashboard key={user.id} user={user}/>
  <MobileNav active="inicio"/>
 </main>
}
