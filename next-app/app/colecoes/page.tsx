import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { CollectionWorkspace } from '@/components/collection-workspace'
export const metadata:Metadata={title:'Minhas coleções'}
export default function CollectionsPage(){
 return <Screen active="colecoes" title="Minhas" accent="coleções." subtitle="Uma estante de descobertas. Cada coleção, uma história sua."><CollectionWorkspace/></Screen>
}
