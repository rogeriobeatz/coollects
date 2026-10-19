'use client'
import {useEffect,useState,type ReactNode} from 'react'
import {Check,Sparkles} from 'lucide-react'

/** Typical KIE/Gemini answer time. The bar is paced to this and never stalls at 100%. */
export const ANALYSIS_EXPECTED_MS=20_000

const STEPS=[
 {at:0,label:'Enviando a foto com segurança'},
 {at:3_000,label:'Lendo os textos da embalagem'},
 {at:8_000,label:'Reconhecendo modelo e fabricante'},
 {at:13_000,label:'Conferindo série e numeração'},
 {at:17_000,label:'Montando a ficha do item'}
]

const TIPS=[
 'Fotos do verso da cartela ajudam a registrar o número da série.',
 'Itens em coleções públicas podem ser compartilhados com um link.',
 'A IA só preenche o que conseguiu ler. Campos vazios são normais.',
 'Uma foto de frente, com boa luz e sem reflexo, traz resultados melhores.',
 'Você pode editar qualquer campo depois, na ficha do item.'
]

/** Fast at first, slower near the end; crawls slowly after the expected time. */
export function analysisProgress(elapsed:number,done:boolean){
 if(done)return 100
 if(elapsed<=ANALYSIS_EXPECTED_MS){const t=elapsed/ANALYSIS_EXPECTED_MS;return Math.round(90*(1-(1-t)*(1-t)))}
 return Math.min(97,Math.round(90+7*(1-Math.exp(-(elapsed-ANALYSIS_EXPECTED_MS)/15_000))))
}

export function AnalysisProgress({startedAt,done,children}:{startedAt:number;done:boolean;children?:ReactNode}){
 const [now,setNow]=useState(()=>Date.now())
 useEffect(()=>{
  if(done)return
  const timer=window.setInterval(()=>setNow(Date.now()),250)
  return ()=>window.clearInterval(timer)
 },[done])
 const elapsed=Math.max(0,now-startedAt)
 const progress=analysisProgress(elapsed,done)
 const current=done?STEPS.length:STEPS.reduce((index,step,i)=>elapsed>=step.at?i:index,0)
 const remaining=Math.ceil((ANALYSIS_EXPECTED_MS-elapsed)/1000)
 const timeLabel=done?'Pronto!':remaining>0?'cerca de '+remaining+' s':elapsed<35_000?'quase lá…':'esta foto está levando mais tempo que o normal'
 const tip=TIPS[Math.floor(elapsed/6_000)%TIPS.length]
 return <section className="analysis-progress" aria-labelledby="analysis-title">
  <div className="analysis-head">
   <Sparkles size={20} aria-hidden="true"/>
   <div><h2 id="analysis-title">{done?'Ficha pronta':'Identificando seu item'}</h2><span>{timeLabel}</span></div>
   <strong aria-hidden="true">{progress}%</strong>
  </div>
  <div className="analysis-track" aria-hidden="true"><span style={{width:progress+'%'}}/></div>
  <ol className="analysis-steps">
   {STEPS.map((step,i)=><li key={step.label} className={i<current?'is-done':i===current?'is-active':''}>
    <i aria-hidden="true">{i<current?<Check size={13}/>:null}</i>{step.label}
   </li>)}
  </ol>
  {/* Announce only step changes, not every tick. */}
  <p className="visually-hidden" role="status">{done?'Análise concluída.':STEPS[current]?.label}</p>
  {!done&&<p className="analysis-tip"><b>Dica</b> {tip}</p>}
  {!done&&children&&<div className="analysis-meanwhile"><p>Enquanto isso, você pode:</p>{children}</div>}
 </section>
}
