import Link from 'next/link'
import { ArrowRight, CarFront, Disc3, Layers3 } from 'lucide-react'
import { WelcomeLogo } from './welcome-logo'

export function WelcomeScreen() {
 return <main className="welcome-page">
  <div className="welcome-brand"><WelcomeLogo/></div>
  <section className="welcome-content" aria-labelledby="welcome-title">
   <p className="welcome-eyebrow">BEM-VINDO AO SEU UNIVERSO</p>
   <h1 id="welcome-title">Suas coleções.<br/><em>Suas histórias.</em></h1>
   <p className="welcome-description">Das primeiras descobertas às peças favoritas. Um lugar para guardar tudo o que você ama colecionar.</p>
   <div className="welcome-keepsakes" aria-hidden="true">
    <div className="welcome-keepsake welcome-keepsake-record"><Disc3 strokeWidth={1.3}/><span>NO SEU RITMO</span></div>
    <div className="welcome-keepsake welcome-keepsake-car"><CarFront strokeWidth={1.4}/><span>GRANDES PAIXÕES</span></div>
    <div className="welcome-keepsake welcome-keepsake-cards"><Layers3 strokeWidth={1.3}/><span>CADA DESCOBERTA</span></div>
   </div>
   <div className="welcome-actions">
    <Link href="/registrar?next=/" className="welcome-create">Criar conta <ArrowRight size={20}/></Link>
    <Link href="/entrar?next=/" className="welcome-signin">Já tenho conta · Entrar</Link>
    <Link href="/explorar" className="welcome-explore">Explorar coleções <ArrowRight size={15}/></Link>
   </div>
  </section>
  <footer className="welcome-footer"><span>FEITO PARA QUEM COLECIONA.</span><div><Link href="/privacidade">Privacidade</Link><span aria-hidden="true">·</span><Link href="/termos">Termos</Link></div></footer>
 </main>
}
