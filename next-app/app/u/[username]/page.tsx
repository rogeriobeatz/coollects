'use client'
import { useParams } from 'next/navigation'
import { Screen } from '@/components/screen'
import { PublicProfile } from '@/components/public-profile'
export default function CollectorPage(){const {username}=useParams<{username:string}>();return <Screen active="explorar" title="Perfil público"><PublicProfile username={username}/></Screen>}
