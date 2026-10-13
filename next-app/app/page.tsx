import Link from 'next/link'
import { ArrowRight, Camera, Compass, Layers3, Sparkles } from 'lucide-react'
import { MobileNav } from '@/components/mobile-nav'
export default function HomePage() {
 return <main className="app-frame">
  <header className="topbar"><div className="brand"><span className="brand-mark">c.</span> coollects</div><span className="eyebrow">SEU UNIVERSO</span></header>
  <section className="hero"><p className="eyebrow light">COLECIONAR É CONTAR HISTÓRIAS</p><h1>O lugar de tudo que você ama colecionar.</h1><p>Digitalize seus itens, organize sua coleção e conecte-se a outros colecionadores.</p><Link className="hero-link" href="/colecoes">Ver minhas coleções <ArrowRight size={18}/></Link><span className="glow" aria-hidden="true">✦</span></section>
  <section className="content"><div className="section-head"><h2>Comece por aqui</h2><span>01 / 03</span></div>
  <div className="quick-actions"><Link href="/cadastrar" className="action accent"><Camera size={27}/><strong>Digitalizar item</strong><small>Fotografe e cadastre</small></Link><Link href="/colecoes" className="action"><Layers3 size={27}/><strong>Minhas coleções</strong><small>Organize seus itens</small></Link></div>
  <Link href="/explorar" className="discovery"><span className="discovery-icon"><Compass size={23}/></span><span><strong>Descubra outras coleções</strong><small>Explore o universo de outros colecionadores</small></span><ArrowRight size={18}/></Link>
  <p className="dev-note"><Sparkles size={15}/> Primeira versão de interface. Cadastro e sincronização serão habilitados na próxima etapa.</p>
  </section><MobileNav active="inicio"/></main>
}
