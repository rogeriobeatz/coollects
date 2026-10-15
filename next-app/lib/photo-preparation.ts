const MAX_BYTES=5*1024*1024
const accepted=new Set(['image/jpeg','image/png','image/webp'])
const heicTypes=new Set(['image/heic','image/heif','image/heic-sequence','image/heif-sequence'])
export type PreparedPhoto={file:File;converted:boolean}
function asFile(blob:Blob,name:string):File{return new File([blob],name,{type:'image/jpeg',lastModified:Date.now()})}
async function decodePhoto(file:File):Promise<HTMLImageElement>{
 const url=URL.createObjectURL(file)
 try{
  const img=new Image()
  img.decoding='async'
  img.src=url
  await img.decode()
  return img
 }finally{ // Safari can release this once decode has finished.
  URL.revokeObjectURL(url)
 }
}
function canvasBlob(canvas:HTMLCanvasElement,quality:number):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível converter a fotografia.')),'image/jpeg',quality))
}
export async function preparePhoto(file:File):Promise<PreparedPhoto>{
 if(!file.size)throw new Error('A fotografia está vazia. Tente selecioná-la novamente.')
 const extension=file.name.split('.').pop()?.toLowerCase()||''
 const compatible=accepted.has(file.type.toLowerCase())
 const heic=heicTypes.has(file.type.toLowerCase())||['heic','heif'].includes(extension)
 if(compatible&&file.size<=MAX_BYTES)return {file,converted:false}
 if(!compatible&&!heic)throw new Error('Formato não suportado. Use JPG, PNG, WebP ou HEIC do iPhone.')
 if(file.size>32*1024*1024)throw new Error('Imagem muito grande. Escolha uma fotografia de até 32 MB.')
 let image:HTMLImageElement
 try{image=await decodePhoto(file)}catch{throw new Error('Não foi possível abrir esta foto. Se for HEIC, exporte como JPEG e tente novamente.')}
 const maxEdge=2400
 const scale=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight))
 const canvas=document.createElement('canvas')
 canvas.width=Math.max(1,Math.round(image.naturalWidth*scale))
 canvas.height=Math.max(1,Math.round(image.naturalHeight*scale))
 const context=canvas.getContext('2d')
 if(!context)throw new Error('Não foi possível preparar a fotografia neste aparelho.')
 context.fillStyle='#FFFFFF'
 context.fillRect(0,0,canvas.width,canvas.height)
 context.drawImage(image,0,0,canvas.width,canvas.height)
 for(const quality of [0.85,0.72,0.58]){
  const blob=await canvasBlob(canvas,quality)
  if(blob.size<=MAX_BYTES)return {file:asFile(blob,'coollects-photo.jpg'),converted:true}
 }
 throw new Error('A imagem permanece muito grande. Tente uma foto com resolução menor.')
}
