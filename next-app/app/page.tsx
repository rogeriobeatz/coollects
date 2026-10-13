import Link from 'next/link'
import { ArrowRight, Camera, Compass, Layers3, Sparkles } from 'lucide-react'
import { MobileNav } from '@/components/mobile-nav'
import { BrandLogo } from '@/components/brand-logo'
export default function HomePage() {
 return <main className="app-frame">
  <header className="topbar"><Link href="/" aria-label="Coollects — início"><BrandLogo/></Link><span className="eyebrow">SEU UNIVERSO</span></header>
  <section className="hero"><p className="eyebrow light">COLECIONAR É CONTAR HISTÓRIAS</p><h1>O lugar de tudo que você ama colecionar.</h1><p>Digitalize seus itens, organize sua coleção e conecte-se a outros colecionadores.</p><Link className="hero-link" href="/colecoes">Criar minha coleção <ArrowRight size={18}/></Link><span className="glow" aria-hidden="true">✦</span></section>
  <section className="content"><div className="section-head"><h2>Comece por aqui</h2><span>01 / 03</span></div>
  <div className="quick-actions"><Link href="/cadastrar" className="action accent"><Camera size={27}/><strong>Digitalizar item</strong><small>Em desenvolvimento</small></Link><Link href="/colecoes" className="action"><Layers3 size={27}/><strong>Minhas coleções</strong><small>Crie sua coleção</small></Link></div>
  <Link href="/explorar" className="discovery"><span className="discovery-icon"><Compass size={23}/></span><span><strong>Descubra outras coleções</strong><small>Exploração pública em desenvolvimento</small></span><ArrowRight size={18}/></Link>
  <p className="dev-note"><Sparkles size={15}/> Prévia de desenvolvimento. Coleções são locais e não sincronizam entre aparelhos.</p>
  </section><MobileNav active="inicio"/></main>
}
