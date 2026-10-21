import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { NotificationsScreen } from '@/components/social-activity'
export const metadata:Metadata={title:'Notificações'}
export default function NotificationsPage(){return <Screen active="notificacoes" title="" subtitle="" compact><NotificationsScreen/></Screen>}
