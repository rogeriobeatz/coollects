import type { Metadata } from 'next'
import { Compass } from 'lucide-react'
import { Screen } from '@/components/screen'
export const metadata:Metadata={title:'Explorar'}
export default function ExplorePage(){return <Screen active="explorar" title="Explorar" subtitle="Conheça as histórias por trás das coleções."><div className="empty-state"><Compass size={42}/><h2>Um universo para descobrir</h2><p>O feed de coleções públicas e os perfis dos colecionadores serão implementados após a integração com o banco de dados.</p></div></Screen>}
