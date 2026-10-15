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
/** Enhances printed card labels independently of illustration and stylised brand marks. */
export function ocrRegions(width:number,height:number){
 return [
  {x:0,y:0,w:1,h:1,scale:1},
  {x:0,y:.77,w:.86,h:.20,scale:3},
  {x:.73,y:.59,w:.27,h:.38,scale:3},
  {x:0,y:0,w:1,h:.36,scale:2},
 ] .map(r=>({left:Math.round(r.x*width),top:Math.round(r.y*height),width:Math.min(width-Math.round(r.x*width),Math.round(r.w*width)),height:Math.min(height-Math.round(r.y*height),Math.round(r.h*height)),scale:r.scale}))
}
async function enhancedCrop(image:HTMLImageElement,r:ReturnType<typeof ocrRegions>[number]):Promise<HTMLCanvasElement>{
 const canvas=document.createElement('canvas')
 canvas.width=Math.min(3000,r.width*r.scale)
 canvas.height=Math.min(3000,r.height*r.scale)
 const ctx=canvas.getContext('2d',{willReadFrequently:true})
 if(!ctx)throw new Error('Não foi possível preparar a leitura.')
 ctx.drawImage(image,r.left,r.top,r.width,r.height,0,0,canvas.width,canvas.height)
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height)
 for(let i=0;i<pixels.data.length;i+=4){
  const v=.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2]
  const contrast=Math.max(0,Math.min(255,(v-128)*1.65+128))
  pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=contrast
 }
 ctx.putImageData(pixels,0,0)
 return canvas
}
async function readCanvas(file:File,onProgress?:(progress:number)=>void):Promise<string>{
 const url=URL.createObjectURL(file)
 const image=new Image()
 try{image.src=url;await image.decode()}finally{URL.revokeObjectURL(url)}
 const worker=await createWorker('eng+por',1,{logger:m=>{if(m.status==='recognizing text'&&typeof m.progress==='number')onProgress?.(Math.round(m.progress*100))}})
 try{
  const all:string[]=[]
  const regions=ocrRegions(image.naturalWidth,image.naturalHeight)
  for(const [index,r] of regions.entries()){
   // Printed model labels generally live in the lower strip and need more pixels.
   if(index>0 && (r.width<15||r.height<15))continue
   const canvas=index===0?file:await enhancedCrop(image,r)
   const {data}=await worker.recognize(canvas)
   all.push(data.text||'')
  }
  return all.join('\n')
 }finally{await worker.terminate()}
}
export async function recognizeLocal(file:File,onProgress?:(progress:number)=>void):Promise<OcrSuggestion>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size===0)throw new Error('Escolha uma foto JPG, PNG ou WebP de até 5 MB.')
 return suggestFromOcr(await readCanvas(file,onProgress))
}
