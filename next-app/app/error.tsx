'use client'
import { useEffect } from 'react'
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error('Coollects unexpected error:',error)},[error])
 return <main className="status-page"><div className="status-body"><span className="status-mark" aria-hidden="true">✳</span><p className="kicker">UM IMPREVISTO ACONTECEU</p><h1>Vamos tentar outra vez?</h1><p>Não conseguimos concluir essa etapa agora. Seus dados permanecem na sua conta.</p><button className="pill-btn" onClick={reset}>Tentar novamente</button></div></main>
}
