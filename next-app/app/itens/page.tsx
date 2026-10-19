import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ItemLibrary } from '@/components/item-library'
export const metadata:Metadata={title:'Meus itens'}
export default function ItemsPage(){return <Screen active="itens" title="Meus" accent="itens." subtitle="Encontre, organize e cuide de cada descoberta do seu acervo."><ItemLibrary/></Screen>}
