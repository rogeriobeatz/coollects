import { describe,expect,it } from 'vitest'
import { safeColor,collectionUrlPath,publicUrlPath } from '../lib/catalog'
import { categoryDetails,CATEGORIES } from '../lib/local-catalog'
describe('Normalização de dados públicos',()=>{
 it('preserva apenas hexadecimais de seis dígitos',()=>{
  expect(safeColor('#6125BF')).toBe('#6125BF')
  expect(safeColor('red; background:url(http://attacker)')).toBe('#6125BF')
  expect(safeColor('#fff')).toBe('#6125BF')
 })
 it('codifica parâmetros de links públicos',()=>{
  expect(publicUrlPath('ana')).toBe('/u/ana')
  expect(collectionUrlPath('abc def')).toBe('/colecao/abc%20def')
 })
 it('prevê categorias desconhecidas sem executar conteúdo',()=>{
  expect(categoryDetails('Outra coisa').name).toBe('Outros')
  expect(CATEGORIES.some(x=>x.name==='Miniaturas')).toBe(true)
 })
})
