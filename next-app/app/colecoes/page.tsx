import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { CollectionWorkspace } from '@/components/collection-workspace'
export const metadata:Metadata={title:'Minhas coleções'}
export default function CollectionsPage(){
 return <Screen active="colecoes" title="Minhas" accent="coleções." subtitle="Cada coleção é um universo só seu. Organize do seu jeito."><CollectionWorkspace/></Screen>
}
