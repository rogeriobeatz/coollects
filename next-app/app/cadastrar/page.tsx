import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ScanWorkspace } from '@/components/scan-workspace'
export const metadata:Metadata={title:'Cadastrar item'}
export default function CapturePage(){return <Screen active="cadastrar" title="" subtitle="" compact><ScanWorkspace aiEnabled={Boolean(process.env.KIE_API_KEY)}/></Screen>}
