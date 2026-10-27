'use client'

import { AppHeader } from './app-header'
import { useAccount } from '@/hooks/use-account'
import { BrandLogo } from './brand-logo'
import { HomeFeed } from './home-feed'
import { MobileNav } from './mobile-nav'
import { SocialToaster } from './social-interactions'
import { ReleaseAnnouncement } from './release-announcement'
import { WelcomeScreen } from './welcome-screen'

export function HomeEntry({aiEnabled=false}:{aiEnabled?:boolean}) {
 const { user, loading } = useAccount()

 if (loading) return <main className="app-frame home-loading" aria-busy="true">
  <BrandLogo/>
  <p role="status">Abrindo seu universo…</p>
 </main>

 if (!user) return <WelcomeScreen/>

 return <main className="app-frame">
  <AppHeader/>
  <div className="screen-body screen-body-compact"><HomeFeed key={user.id} user={user} aiEnabled={aiEnabled}/></div>
  <SocialToaster/>
  <ReleaseAnnouncement userId={user.id}/>
  <MobileNav active="inicio"/>
 </main>
}
