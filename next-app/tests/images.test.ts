import {describe,it,expect} from 'vitest'
import {validateImageFile} from '../lib/images'
function fixture(header:number[],type:string){
 return new File([Uint8Array.from([...header,0,0,0,0])],'item',{type})
}
describe('Validação real de fotografias',()=>{
 it('aceita um JPEG com assinatura correspondente',async()=>{
  await expect(validateImageFile(fixture([255,216,255,224],'image/jpeg'))).resolves.toBe('image/jpeg')
 })
 it('aceita PNG verdadeiro',async()=>{
  await expect(validateImageFile(fixture([137,80,78,71,13,10,26,10],'image/png'))).resolves.toBe('image/png')
 })
 it('aceita WebP verdadeiro',async()=>{
  await expect(validateImageFile(fixture([82,73,70,70,4,0,0,0,87,69,66,80],'image/webp'))).resolves.toBe('image/webp')
 })
 it('rejeita texto ou HTML disfarçado de imagem',async()=>{
  await expect(validateImageFile(fixture([60,115,99,114,105,112,116,62],'image/png'))).rejects.toThrow()
 })
 it('rejeita cabeçalho correto com tipo diferente',async()=>{
  await expect(validateImageFile(fixture([255,216,255,224],'image/webp'))).rejects.toThrow()
 })
 it('rejeita arquivo vazio',async()=>{
  await expect(validateImageFile(new File([],'empty.png',{type:'image/png'}))).rejects.toThrow()
 })
})
