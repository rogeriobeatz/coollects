import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ScanWorkspace } from '@/components/scan-workspace'
export const metadata:Metadata={title:'Cadastrar item'}
export default function CapturePage(){return <Screen active="cadastrar" title="Novo item," accent="nova história." subtitle="Fotografe, descreva e comece a construir seu acervo."><ScanWorkspace/></Screen>}
