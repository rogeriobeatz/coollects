import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ProfileWorkspace } from '@/components/profile-workspace'
export const metadata:Metadata={title:'Editar perfil'}
export default function EditProfilePage(){return <Screen active="perfil" backHref="/perfil" title="Editar" accent="perfil." subtitle="Sua identidade e sua conta no Coollects."><ProfileWorkspace/></Screen>}
