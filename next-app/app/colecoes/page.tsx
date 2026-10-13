import type { Metadata } from 'next'
import { Layers3, Plus } from 'lucide-react'
import Link from 'next/link'
import { Screen } from '@/components/screen'
export const metadata:Metadata={title:'Minhas coleções'}
export default function CollectionsPage(){return <Screen active="colecoes" title="Minhas coleções" subtitle="Cada coleção guarda uma história."><div className="empty-state"><Layers3 size={42}/><h2>Sua biblioteca começa aqui</h2><p>Em breve você poderá criar coleções, escolher categorias e adicionar seus itens.</p><Link className="primary-btn" href="/cadastrar"><Plus size={19}/> Começar a cadastrar</Link></div></Screen>}
