import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ProfileWorkspace } from '@/components/profile-workspace'
export const metadata:Metadata={title:'Perfil'}
export default function ProfilePage(){return <Screen active="perfil" title="Seu" accent="perfil." subtitle="Sua identidade no universo Coollects."><ProfileWorkspace/></Screen>}
