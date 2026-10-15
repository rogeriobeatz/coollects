import { createWorker, PSM } from 'tesseract.js'

export type OcrBox={left:number;top:number;width:number;height:number;confidence:number;text:string;source:string}
export type OcrRegionResult={region:string;text:string;confidence:number;box?:Omit<OcrBox,'confidence'|'text'|'source'>}
export type OcrProgress={stage:string;percent:number}
export type OcrSuggestion={name:string;brand:string;category:'Miniaturas';notes:string;visibleText:string;confidence:'low'|'medium'|'high';debug?:OcrRegionResult[];boxes?:OcrBox[];imageWidth?:number;imageHeight?:number}
const brands=['Hot Wheels','Matchbox','MINI GT','Kaido House','Tomica','Majorette','GreenLight','Johnny Lightning','Auto World','Inno64','Tarmac Works','Maisto','Bburago','Jada Toys']
const cars=['Porsche','Nissan','Toyota','Honda','Ford','Chevrolet','Volkswagen','BMW','Mercedes-Benz','Mercedes','Lamborghini','Ferrari','McLaren','Audi','Dodge','Mazda','Subaru','Mitsubishi','Volvo','Jeep','Jaguar','Aston Martin','Hyundai','Kia']
const noise=/^(hot wheels|matchbox|mini gt|kaido house|die.?cast|made in|collect them all|ages? ?\d+|\d+\/?\d*|\d+:\d+|warning|advertencia|choking hazard|not for children|mattel|©|www\.|[0-9]{8,14})$/i
/** Distinguish recognizable printed model labels from drawing artifacts. */
export function extractModelLine(raw:string):string{
 const line=raw.replace(/\s+/g,' ').trim()
 // OCR commonly reads the leading '9' as S, $ or 5 on Porsche 911 cards.
 const porsche=line.match(/\bPORSCHE\s+(?:911|S11|\$11|5I1|SII)\s+CARRERA(?:\s+[A-Z0-9-]+){0,2}/i)
 if(porsche)return porsche[0].replace(/\s+(?:S11|\$11|5I1|SII)\s+/i,' 911 ').replace(/\s+3\s*\+?$/,'').trim()
 const found=cars.find(car=>new RegExp('\\b'+car.replace(/[.*+?^${}()|[\]\\]/g,'\\export function suggestFromOcr(raw:string):OcrSuggestion{')+'\\b','i').test(line))
 if(!found)return ''
 const start=line.toLowerCase().indexOf(found.toLowerCase())
 const tail=line.slice(start).replace(/[^\p{L}\p{N}\s+./-]/gu,' ').replace(/\s+/g,' ').trim()
 const tokens=tail.split(' ')
 // Model extraction requires an additional plausible token; maker alone is not a model.
 if(tokens.length<2||tokens[1].length<2&&!/\d/.test(tokens[1]))return ''
 return tokens.slice(0,8).join(' ').slice(0,90)
}
export function suggestFromOcr(raw:string):OcrSuggestion{
 const lines=raw.split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(x=>x.length>=3).slice(0,60)
 const combined=lines.join(' ')
 const foundBrand=brands.find(b=>new RegExp(b.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&').replace(/\s+/g,'\\s*'),'i').test(combined))||''
 const candidate=lines.filter(line=>!noise.test(line)&&line.length<=65&&!/https?:|@|copyright|[©®™]|\b(safety|warning|advertencia|fabricado|made in|ages|escala|series)\b/i.test(line))
 const vehicle=candidate.map(extractModelLine).find(Boolean)
 const model=vehicle||''
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
export function selectOcrText(readings:OcrRegionResult[]):string{
 // Prefer the printed model label over decorative artwork; low-confidence full-card
 // hallucinations are retained only in the diagnostics, not in the item suggestion.
 const accepted=readings.filter(r=>r.confidence>=24 && r.text.trim().length>=3 && r.region!=='Cartela completa')
 const candidates=accepted.flatMap(r=>r.text.split(/\r?\n/).map(text=>({text,model:extractModelLine(text),confidence:r.confidence})))
 const valid=candidates.filter(x=>x.model).sort((a,b)=>b.confidence-a.confidence)
 const other=accepted.flatMap(r=>r.text.split(/\r?\n/)).filter(x=>brands.some(b=>x.toLowerCase().includes(b.toLowerCase())))
 return [...valid.slice(0,2).map(x=>x.model),...other].join('\n')
}
type Rectangle={left:number;top:number;width:number;height:number}
type TesseractLine={text:string;confidence:number;bbox:{x0:number;y0:number;x1:number;y1:number}}
type TesseractBlock={paragraphs?:{lines?:TesseractLine[]}[]}
function detectedLines(blocks:TesseractBlock[]|null|undefined,width:number,height:number):OcrBox[]{
 const lines=(blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]))
 return lines.filter(l=>l.text.trim().length>=3).map(l=>{
  const {x0,y0,x1,y1}=l.bbox
  return {left:Math.max(0,x0),top:Math.max(0,y0),width:Math.max(1,Math.min(width-x0,x1-x0)),height:Math.max(1,Math.min(height-y0,y1-y0)),text:l.text.trim(),confidence:Math.round(l.confidence),source:'Detecção automática'}
 }).filter(b=>b.width>12&&b.height>5&&b.height<height*.20)
}
export function proposedLineRegions(boxes:OcrBox[],width:number,height:number):Rectangle[]{
 const candidates=boxes.filter(b=>b.confidence>=20&&b.text.length>=4)
   .sort((a,b)=>scoreLine(b.text,b.top,height)-scoreLine(a.text,a.top,height))
 return candidates.slice(0,5).map(b=>{
  const padX=Math.max(8,Math.round(b.width*.08)),padY=Math.max(6,Math.round(b.height*.3))
  const left=Math.max(0,b.left-padX),top=Math.max(0,b.top-padY)
  return {left,top,width:Math.min(width-left,b.width+padX*2),height:Math.min(height-top,b.height+padY*2)}
 })
}
function scoreLine(text:string,y:number,height:number):number{
 return (cars.some(c=>text.toUpperCase().includes(c.toUpperCase()))?100:0)
  +(/\b(911|S11|\$11|gt|gtr|rs|supra|civic|skyline|mustang|carrera)\b/i.test(text)?50:0)
  +(y>height*.73?12:0)+Math.min(40,text.length)/10
}
function bounds(region:Rectangle){return {left:region.left,top:region.top,width:region.width,height:region.height}}
export function refineOcrModel(text:string):string{
 // Contextual disambiguation, not arbitrary substitution: only 911 Carrera on Porsche labels.
 return text.replace(/\b(PORSCHE\s+)(?:S11|\$11|5I1|SII)(\s+CARRERA\b)/gi,(_match,a:string,b:string)=>a+'911'+b)
}
async function readCanvas(file:File,onProgress?:(progress:number)=>void):Promise<{readings:OcrRegionResult[];boxes:OcrBox[];width:number;height:number}>{
 const url=URL.createObjectURL(file)
 const image=new Image()
 try{image.src=url;await image.decode()}finally{URL.revokeObjectURL(url)}
 const width=image.naturalWidth,height=image.naturalHeight
 const worker=await createWorker('eng+por',1)
 try{
  const all:OcrRegionResult[]=[],boxes:OcrBox[]=[]
  const full=await worker.recognize(file,{}, {blocks:true,text:true})
  all.push({region:'Cartela completa',text:(full.data.text||'').trim(),confidence:Math.round(full.data.confidence||0),box:{left:0,top:0,width,height}})
  const detected=detectedLines(full.data.blocks as TesseractBlock[]|null|undefined,width,height)
  boxes.push(...detected)
  onProgress?.(15)
  const primary=ocrRegions(width,height).slice(1)
  const labels=['Nome do modelo','Série e numeração','Cabeçalho da embalagem']
  // Geometry fallback complements automatic text detection for small printed labels.
  const regions=[...primary.map((r,i)=>({...r,label:labels[i],source:'Área da embalagem'})),
   ...proposedLineRegions(detected,width,height).map((r,i)=>({...r,scale:3,label:'Texto detectado '+(i+1),source:'Detecção automática'}))]
  for(const [index,r] of regions.entries()){
   if(r.width<15||r.height<12)continue
   const canvas=await enhancedCrop(image,r)
   // Treat a tightly cropped printed label as a text line, not a page.
   await worker.setParameters({tessedit_pageseg_mode:r.label==='Nome do modelo'?PSM.SINGLE_LINE:PSM.SINGLE_BLOCK})
   const {data}=await worker.recognize(canvas)
   const confidence=Math.round(data.confidence||0),text=(data.text||'').trim()
   all.push({region:r.label,text,confidence,box:bounds(r)})
   if(text.length>=3)boxes.push({...bounds(r),text,confidence,source:r.source})
   onProgress?.(Math.round(15+(index+1)/regions.length*85))
  }
  return {readings:all,boxes,width,height}
 }finally{await worker.terminate()}
}
export async function recognizeLocal(file:File,onProgress?:(progress:number)=>void):Promise<OcrSuggestion>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024||file.size===0)throw new Error('Escolha uma foto JPG, PNG ou WebP de até 5 MB.')
 const {readings,boxes,width,height}=await readCanvas(file,onProgress)
 const output=suggestFromOcr(refineOcrModel(selectOcrText(readings)))
 return {...output,debug:readings,boxes,imageWidth:width,imageHeight:height}
}
