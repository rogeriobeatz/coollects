import type { Metadata } from 'next'
import { Camera, PenLine, Sparkles } from 'lucide-react'
import { Screen } from '@/components/screen'
export const metadata:Metadata={title:'Cadastrar item'}
export default function CapturePage(){return <Screen active="cadastrar" title="Cadastrar item" subtitle="Uma foto é o primeiro passo para digitalizar sua coleção."><div className="capture-panel"><Camera size={42}/><h2>Digitalização inteligente</h2><p>A câmera, o OCR e a confirmação dos dados serão conectados em uma próxima entrega. Nenhuma foto é enviada nesta versão.</p><div className="capture-options"><span><Sparkles size={17}/> Identificação assistida</span><span><PenLine size={17}/> Cadastro manual</span></div></div></Screen>}
