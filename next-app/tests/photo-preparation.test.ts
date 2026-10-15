import { describe,it,expect } from 'vitest'
import { preparePhoto } from '../lib/photo-preparation'
describe('Mobile photo preparation',()=>{
 it('keeps valid small JPEG photos intact',async()=>{
  const file=new File([new Uint8Array([255,216,255])],'photo.jpg',{type:'image/jpeg'})
  const result=await preparePhoto(file)
  expect(result.file).toBe(file);expect(result.converted).toBe(false)
 })
 it('rejects non-photo files with a useful message',async()=>{
  const file=new File(['not an image'],'document.txt',{type:'text/plain'})
  await expect(preparePhoto(file)).rejects.toThrow('Formato não suportado')
 })
 it('rejects empty files before attempting to preview',async()=>{
  const file=new File([],'empty.jpg',{type:'image/jpeg'})
  await expect(preparePhoto(file)).rejects.toThrow('vazia')
 })
})
