'use client'
import { useParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicProfile } from '@/components/public-profile'
export default function CollectorPage(){const {username}=useParams<{username:string}>();return <Screen active="explorar" title="Colecionar é" accent="compartilhar." subtitle="Conheça quem está por trás do acervo."><PublicProfile username={username}/></Screen>}
