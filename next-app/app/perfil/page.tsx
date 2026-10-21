import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { OwnProfile } from '@/components/own-profile'
export const metadata:Metadata={title:'Perfil'}
export default function ProfilePage(){return <Screen active="perfil" title="" subtitle="" compact><OwnProfile/></Screen>}
