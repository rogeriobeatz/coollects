import { createWorker } from 'tesseract.js'

export type OcrSuggestion={name:string;brand:string;category:'Miniaturas';notes:string;visibleText:string;confidence:'low'|'medium'|'high'}
const brands=['Hot Wheels','Matchbox','MINI GT','Kaido House','Tomica','Majorette','GreenLight','Johnny Lightning','Auto World','Inno64','Tarmac Works','Maisto','Bburago','Jada Toys']
const cars=['Porsche','Nissan','Toyota','Honda','Ford','Chevrolet','Volkswagen','BMW','Mercedes-Benz','Mercedes','Lamborghini','Ferrari','McLaren','Audi','Dodge','Mazda','Subaru','Mitsubishi','Volvo','Jeep','Jaguar','Aston Martin','Hyundai','Kia']
const noise=/^(hot wheels|matchbox|mini gt|kaido house|die.?cast|made in|collect them all|ages? ?\d+|\d+\/?\d*|\d+:\d+|warning|advertencia|choking hazard|not for children|mattel|©|www\.|[0-9]{8,14})$/i
export function suggestFromOcr(raw:string):OcrSuggestion{
 const lines=raw.split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(x=>x.length>=3).slice(0,60)
 const combined=lines.join(' ')
 const foundBrand=brands.find(b=>new RegExp(b.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&').replace(/\s+/g,'\\s*'),'i').test(combined))||''
 const candidate=lines.filter(line=>!noise.test(line)&&line.length<=65&&!/https?:|@|copyright|[©®™]|\b(safety|warning|advertencia|fabricado|made in|ages|escala|series)\b/i.test(line))
 const vehicle=candidate.find(line=>cars.some(b=>line.toLowerCase().includes(b.toLowerCase()))&&line.length<55)
 const model=vehicle||candidate.find(line=>/\b(19|20)\d{2}\b|\b(gt|gtr|rs|911|supra|skyline|civic|mustang|camaro|corvette|silvia)\b/i.test(line))||''
 const strong=Boolean(model&&foundBrand)
 return {name:model.slice(0,90),brand:foundBrand,category:'Miniaturas',notes:'',visibleText:lines.join(' | ').slice(0,450),confidence:strong?'medium':model||foundBrand?'low':'low'}
}
export async function recognizeLocal(file:File,onProgress?:(progress:number)=>void):Promise<OcrSuggestion>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size===0)throw new Error('Escolha uma foto JPG, PNG ou WebP de até 5 MB.')
 // Engine runs in the browser. Language/wasm files are downloaded on first use.
 const worker=await createWorker('eng+por',1,{logger:m=>{if(m.status==='recognizing text'&&typeof m.progress==='number')onProgress?.(Math.round(m.progress*100))}})
 try{
  const {data}=await worker.recognize(file)
  return suggestFromOcr(data.text||'')
 }finally{await worker.terminate()}
}
