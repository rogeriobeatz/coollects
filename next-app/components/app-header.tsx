import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from './brand-logo'
import { HeaderNotifications } from './header-notifications'

export function AppHeader({backHref,notificationsCurrent=false}:{backHref?:string;notificationsCurrent?:boolean}){
 return <header className="topbar app-header">
  {backHref&&<Link href={backHref} className="back" aria-label="Voltar"><ArrowLeft size={22}/></Link>}
  <Link href="/" className="screen-logo" aria-label="Coollects — início"><BrandLogo/></Link>
  <HeaderNotifications current={notificationsCurrent}/>
 </header>
}
