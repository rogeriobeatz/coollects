import { BrandLogo } from './brand-logo'
export function LaunchHold() {
 return <main className="launch-hold" role="main">
  <div className="launch-content">
   <div className="launch-logo"><BrandLogo/></div>
   <span className="launch-spark" aria-hidden="true">✳</span>
   <p className="launch-eyebrow">SEU UNIVERSO DE COLEÇÕES</p>
   <h1>O melhor de colecionar <em>está chegando.</em></h1>
   <p>Estamos preparando uma experiência especial para guardar e compartilhar suas paixões. Em breve, nos encontramos por aqui.</p>
   <div className="launch-illustration" aria-hidden="true"><span>✦</span><span>●</span><span>✳</span></div>
  </div>
 </main>
}
