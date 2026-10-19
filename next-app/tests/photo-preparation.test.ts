import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {preparePhoto} from '../lib/photo-preparation'
import {MAX_PHOTO_BYTES,MAX_PHOTO_EDGE} from '../lib/photo-limits'

type Mime='image/webp'|'image/jpeg'
let originalWidth=4000
let originalHeight=3000
let supportsWebp=true
let encodedSize:(width:number,quality:number,mime:Mime)=>number
let widths:number[]=[]

beforeEach(()=>{
 originalWidth=4000
 originalHeight=3000
 supportsWebp=true
 widths=[]
 encodedSize=()=>300_000
 const canvas={
  width:0,height:0,
  getContext:()=>({fillStyle:'',fillRect:()=>{},drawImage:()=>{widths.push(canvas.width)}}),
  toBlob:(callback:(blob:Blob|null)=>void,mime:Mime,quality:number)=>{
   const type=mime==='image/webp'&&!supportsWebp?'image/png':mime
   const size=encodedSize(canvas.width,quality,mime)
   callback(new Blob([new Uint8Array(size)],{type}))
  }
 }
 vi.stubGlobal('Image',class {
  naturalWidth=originalWidth
  naturalHeight=originalHeight
  decoding=''
  src=''
  async decode(){}
 })
 vi.stubGlobal('URL',{createObjectURL:()=> 'blob:photo',revokeObjectURL:()=>{}})
 vi.stubGlobal('document',{createElement:(tag:string)=>tag==='canvas'?canvas:null})
})
afterEach(()=>vi.unstubAllGlobals())

describe('600 KB photo optimization',()=>{
 it('re-encodes even small camera JPEGs as WebP and never upscales',async()=>{
  originalWidth=1000
  originalHeight=800
  const original=new File([new Uint8Array([255,216,255])],'photo.jpg',{type:'image/jpeg'})
  const output=await preparePhoto(original)
  expect(output.converted).toBe(true)
  expect(output.file).not.toBe(original)
  expect(output.file.type).toBe('image/webp')
  expect(output.file.name).toBe('coollects-photo.webp')
  expect(output.file.size).toBeLessThanOrEqual(MAX_PHOTO_BYTES)
  expect(widths).toEqual([1000])
 })

 it('shrinks high-resolution photos progressively until <=600000 bytes',async()=>{
  encodedSize=width=>width>640?690_000:480_000
  const original=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'photo.png',{type:'image/png'})
  const output=await preparePhoto(original)
  expect(output.file.type).toBe('image/webp')
  expect(output.file.size).toBe(480_000)
  expect(widths[0]).toBe(MAX_PHOTO_EDGE)
  expect(widths.at(-1)).toBe(640)
  expect(widths.length).toBeGreaterThan(1)
 })

 it('falls back to JPEG if WebP encoding is unsupported',async()=>{
  supportsWebp=false
  const original=new File(['heic bytes'],'iphone.heic',{type:'image/heic'})
  const output=await preparePhoto(original)
  expect(output.file.type).toBe('image/jpeg')
  expect(output.file.name).toBe('coollects-photo.jpg')
  expect(output.file.size).toBeLessThanOrEqual(MAX_PHOTO_BYTES)
 })

 it('refuses files that cannot be compressed within the hard budget',async()=>{
  encodedSize=()=>700_000
  const original=new File(['png'],'photo.png',{type:'image/png'})
  await expect(preparePhoto(original)).rejects.toThrow('600 KB')
 })

 it('rejects non-photo formats and empty files',async()=>{
  await expect(preparePhoto(new File(['script'],'malware.svg',{type:'image/svg+xml'}))).rejects.toThrow('Formato não suportado')
  await expect(preparePhoto(new File([],'empty.jpg',{type:'image/jpeg'}))).rejects.toThrow('vazia')
 })
})
