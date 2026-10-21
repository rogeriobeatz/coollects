import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ExploreShowcase } from '@/components/explore-showcase'
export const metadata:Metadata={title:'Explorar'}
export default function ExplorePage(){return <Screen compact active="explorar" title="" subtitle=""><header className="explore-heading"><h1>Explorar</h1><p>Coleções e pessoas que compartilham suas paixões.</p></header><ExploreShowcase/></Screen>}
