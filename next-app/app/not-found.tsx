import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
export default function NotFound(){
 return <main className="status-page"><div className="status-logo"><Link href="/"><BrandLogo/></Link></div><div className="status-body"><span className="status-mark" aria-hidden="true">✳</span><p className="kicker">OPS, PERDEMOS A TRILHA</p><h1>Essa página não está por aqui.</h1><p>O endereço pode ter mudado. Que tal continuar explorando?</p><Link href="/" className="pill-btn">Voltar ao início</Link></div></main>
}
