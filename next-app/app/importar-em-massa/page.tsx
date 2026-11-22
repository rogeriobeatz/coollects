import type {Metadata} from 'next'
import {Screen} from '@/components/screen'
import {BulkImportWorkspace} from '@/components/bulk-import-workspace'
export const metadata:Metadata={title:'Cadastro em massa'}
export default function BulkImportPage(){return <Screen active="cadastrar" title="Cadastro em massa" subtitle="Até 100 fotos. Um item por foto." compact><BulkImportWorkspace/></Screen>}
