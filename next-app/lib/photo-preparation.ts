import { MAX_PHOTO_BYTES,MAX_SOURCE_PHOTO_BYTES,MAX_PHOTO_EDGE } from './photo-limits'

const accepted=new Set(['image/jpeg','image/png','image/webp'])
const heicTypes=new Set(['image/heic','image/heif','image/heic-sequence','image/heif-sequence'])
const qualities=[0.82,0.72,0.60,0.48,0.36]
const edges=[1600,1280,1024,800,640,480,320,240] as const

export type PreparedPhoto={file:File;converted:boolean}

function outputFile(blob:Blob):File{
 const ext=blob.type==='image/webp'?'webp':'jpg'
 return new File([blob],'coollects-photo.'+ext,{type:blob.type,lastModified:Date.now()})
}

async function decodePhoto(file:File):Promise<HTMLImageElement>{
 const url=URL.createObjectURL(file)
 try{
  const img=new Image()
  img.decoding='async'
  img.src=url
  await img.decode()
  if(!img.naturalWidth||!img.naturalHeight)throw new Error('Empty image')
  return img
 }finally{
  URL.revokeObjectURL(url)
 }
}

function canvasBlob(canvas:HTMLCanvasElement,mime:string,quality:number):Promise<Blob|null>{
 return new Promise(resolve=>canvas.toBlob(resolve,mime,quality))
}

/**
 * Every photo is re-encoded locally to strip camera metadata and fit a hard
 * storage budget. Prefer WebP; use JPEG on browsers without WebP encoding.
 * Never upload a bigger file and never upscale a small source image.
 */
export async function preparePhoto(file:File):Promise<PreparedPhoto>{
 if(!file.size)throw new Error('A fotografia está vazia. Tente selecioná-la novamente.')
 if(file.size>MAX_SOURCE_PHOTO_BYTES)throw new Error('Imagem muito grande. Escolha uma fotografia de até 32 MB.')
 const extension=file.name.split('.').pop()?.toLowerCase()||''
 const compatible=accepted.has(file.type.toLowerCase())
 const heic=heicTypes.has(file.type.toLowerCase())||['heic','heif'].includes(extension)
 if(!compatible&&!heic)throw new Error('Formato não suportado. Use JPG, PNG, WebP ou HEIC do iPhone.')
 let image:HTMLImageElement
 try{image=await decodePhoto(file)}catch{
  throw new Error('Não foi possível abrir esta foto. Se for HEIC, exporte como JPEG e tente novamente.')
 }
 const originalEdge=Math.max(image.naturalWidth,image.naturalHeight)
 const canvas=document.createElement('canvas')
 const context=canvas.getContext('2d')
 if(!context)throw new Error('Não foi possível preparar a fotografia neste aparelho.')
 let outputMime:'image/webp'|'image/jpeg'='image/webp'
 let lastEdge=0
 for(const targetEdge of edges){
  const maxEdge=Math.min(MAX_PHOTO_EDGE,targetEdge,originalEdge)
  if(maxEdge===lastEdge)continue
  lastEdge=maxEdge
  const scale=maxEdge/originalEdge
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale))
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale))
  context.fillStyle='#FFFFFF'
  context.fillRect(0,0,canvas.width,canvas.height)
  context.drawImage(image,0,0,canvas.width,canvas.height)
  for(const quality of qualities){
   let blob=await canvasBlob(canvas,outputMime,quality)
   // Unsupported MIME types commonly fall back silently to PNG.
   if(outputMime==='image/webp'&&blob?.type!=='image/webp'){
    outputMime='image/jpeg'
    blob=await canvasBlob(canvas,outputMime,quality)
   }
   if(!blob||blob.type!==outputMime)throw new Error('Este navegador não conseguiu converter a fotografia.')
   if(blob.size>0&&blob.size<=MAX_PHOTO_BYTES)return {file:outputFile(blob),converted:true}
  }
 }
 throw new Error('Não foi possível reduzir esta foto para 600 KB. Escolha outra fotografia.')
}
