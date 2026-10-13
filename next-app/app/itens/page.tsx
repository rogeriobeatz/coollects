import type { Metadata } from 'next'
import { Screen } from '@/components/screen'
import { ItemLibrary } from '@/components/item-library'
export const metadata:Metadata={title:'Meus itens'}
export default function ItemsPage(){return <Screen active="colecoes" title="Meus" accent="itens." subtitle="Seu catálogo digital, em qualquer dispositivo."><ItemLibrary/></Screen>}
