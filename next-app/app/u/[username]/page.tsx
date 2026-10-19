'use client'
import { useParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicProfile } from '@/components/public-profile'
import { GuestSharedShell } from '@/components/guest-shared-shell'
import { useAccount } from '@/hooks/use-account'
export default function CollectorPage(){const {username}=useParams<{username:string}>();const {user,loading}=useAccount();const content=<PublicProfile username={username}/>;if(loading)return <main className="guest-shared-loading" role="status">Abrindo perfil…</main>;if(!user)return <GuestSharedShell returnTo={'/u/'+encodeURIComponent(username)}>{content}</GuestSharedShell>;return <Screen active="explorar" title="Colecionar é" accent="compartilhar." subtitle="Conheça quem está por trás do acervo.">{content}</Screen>}
