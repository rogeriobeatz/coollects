import type {Metadata} from 'next'
import {Screen} from '@/components/screen'
import {AcervoWorkspace} from '@/components/acervo-workspace'
export const metadata:Metadata={title:'Acervo'}
export default function AcervoPage(){return <Screen active="colecoes" title="Acervo"><AcervoWorkspace/></Screen>}
