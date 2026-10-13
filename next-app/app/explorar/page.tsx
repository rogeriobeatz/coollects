import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ExploreShowcase } from '@/components/explore-showcase'
export const metadata:Metadata={title:'Explorar'}
export default function ExplorePage(){return <Screen active="explorar" title="Explorar" accent="universos." subtitle="Inspiração para quem vê histórias em cada objeto."><ExploreShowcase/></Screen>}
