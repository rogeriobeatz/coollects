import {describe,expect,it} from 'vitest'
import {itemCardPalette,itemCardStyle} from '../lib/item-card-theme'
import type {ItemRow} from '../lib/catalog'
function item(color:string|null,manufacturer='Porsche'){
 return {name:'911 Carrera',brand:'Hot Wheels',category:'Miniaturas',details:{color,manufacturer}} as Pick<ItemRow,'name'|'brand'|'category'|'details'>
}
describe('Moldura de cards por cor do veículo',()=>{
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
