import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { CollectionWorkspace } from '@/components/collection-workspace'
export const metadata:Metadata={title:'Minhas coleções'}
export default function CollectionsPage(){return <Screen active="colecoes" title="Minhas coleções" subtitle="Toda coleção começa com uma história."><CollectionWorkspace/></Screen>}
