import {describe,expect,it} from 'vitest'
import {itemCardPalette,itemCardStyle} from '../lib/item-card-theme'
import type {ItemRow} from '../lib/catalog'
function item(color:string|null,manufacturer='Porsche'){
 return {name:'911 Carrera',brand:'Hot Wheels',category:'Miniaturas',details:{color,manufacturer}} as Pick<ItemRow,'name'|'brand'|'category'|'details'>
}
describe('Moldura de cards por cor do veículo',()=>{
 it('garante contraste de texto de 4.5:1 nas cores nomeadas e em tons hexadecimais',()=>{
  function luminance(hex:string){
   const channels=hex.slice(1).match(/../g)!.map(channel=>parseInt(channel,16)/255).map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4))
   return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722
  }
  const named=['Laranja','Dourado','Rosa','Turquesa','Ciano','Cinza','Verde','Branco','Preto',null]
  const hex=Array.from({length:4096},(_,index)=>'#'+index.toString(16).padStart(3,'0'))
  for(const color of [...named,...hex]){
   const palette=itemCardPalette(item(color))
   const [a,b]=[luminance(palette.frame),luminance(palette.ink)].sort((x,y)=>y-x)
   expect((a+.05)/(b+.05),String(color)).toBeGreaterThanOrEqual(4.5)
  }
 })
 it('usa a cor informada na ficha mesmo com montadora diferente',()=>{
  expect(itemCardPalette(item('Azul metálico')).frame).toBe('#286ac2')
  expect(itemCardPalette(item('azul metálico','Ferrari')).frame).toBe('#286ac2')
  expect(itemCardPalette(item('Vermelho')).frame).toBe('#d63238')
 })
 it('mantém contraste legível para carros claros',()=>{
  expect(itemCardPalette(item('Branco')).ink).toBe('#211827')
  expect(itemCardPalette(item('Amarelo')).ink).toBe('#211827')
  expect(itemCardPalette(item('Preto')).ink).toBe('#ffffff')
 })
 it('aceita hexadecimal válido e rejeita strings inesperadas',()=>{
  expect(itemCardPalette(item('#0aB3cc')).frame).toBe('#0ab3cc')
  expect(itemCardPalette(item('linear-gradient(red,blue)')).frame).toBe('#6035ae')
  expect(itemCardPalette(item(null)).frame).toBe('#6035ae')
  expect(itemCardStyle(item('verde'))['--deck-frame' as keyof ReturnType<typeof itemCardStyle>]).toBe('#318567')
 })
})
