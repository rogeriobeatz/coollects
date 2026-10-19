import {describe,it,expect} from 'vitest'
import {itemValue,miniatureSpecs,vehicleSpecs} from '../lib/item-presentation'
const item={name:'Carrera RS',category:'Miniaturas',brand:'Hot Wheels',details:{manufacturer:'Porsche',year:2026,vehicleYear:'1973',scale:'1:64',power:'210 cv',engine:'2.7 L'}}
describe('Identidade da miniatura e ficha do veículo',()=>{
 it('mantém ano da cartela separado do ano do carro',()=>{
  expect(miniatureSpecs(item)).toContainEqual({key:'year',label:'Ano da cartela',value:'2026'})
  expect(vehicleSpecs(item)).toContainEqual({key:'vehicleYear',label:'Ano do veículo',value:'1973'})
  expect(vehicleSpecs(item).map(spec=>spec.key)).not.toContain('year')
  expect(vehicleSpecs(item).map(spec=>spec.key)).not.toContain('scale')
 })
 it('exibe só dados cadastrados, com a unidade fornecida pelo usuário',()=>{
  expect(vehicleSpecs(item)).toContainEqual({key:'power',label:'Potência',value:'210 cv'})
  expect(vehicleSpecs({...item,details:{manufacturer:'Porsche',year:2026}})).toEqual([])
 })
 it('não transforma placeholders em identidade ou dados técnicos',()=>{
  for(const value of [null,undefined,'','  ','Montadora','MARCA','N/A','Não informado'])expect(itemValue(value)).toBe('')
  expect(itemValue(0)).toBe('0')
  expect(itemValue(' Ford ')).toBe('Ford')
 })
})
