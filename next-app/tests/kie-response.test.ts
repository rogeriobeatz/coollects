import {describe,it,expect} from 'vitest'
import {parseKieSuggestion} from '../lib/kie-parser'
describe('Kie multimodal response validation',()=>{
 const item='{"name":"Porsche 911 Carrera T","brand":"Hot Wheels","category":"Miniaturas","notes":"Factory Fresh · 15/250","confidence":"high"}'
 it('accepts a correct JSON response',()=>{expect(parseKieSuggestion(item).name).toBe('Porsche 911 Carrera T')})
 it('handles markdown JSON fences',()=>{expect(parseKieSuggestion('```json\n'+item+'\n```').brand).toBe('Hot Wheels')})
 it('extracts JSON surrounded by explanatory text',()=>{expect(parseKieSuggestion('Here is the result: '+item+' Done.').name).toBe('Porsche 911 Carrera T')})
 it('rejects arbitrary text and unsafe confidence values',()=>{
  expect(()=>parseKieSuggestion('invalid')).toThrow()
  expect(()=>parseKieSuggestion('{"confidence":"certain"}')).toThrow()
 })
 it('extracts Hot Wheels details without burying them in notes',()=>{
  const output=parseKieSuggestion(JSON.stringify({name:"'85 Honda City Turbo II",brand:'Hot Wheels',category:'Miniaturas',notes:'',details:{manufacturer:'Honda',series:'Compact Kings',seriesNumber:'4/10',collectionNumber:'105/250',year:null}}))
  expect(output.details.manufacturer).toBe('Honda')
  expect(output.details.seriesNumber).toBe('4/10')
  expect(output.details.collectionNumber).toBe('105/250')
  expect(output.details.year).toBe(null)
  expect(output.notes).toBe('')
 })

 it('accepts real Porsche result with nullable fields',()=>{
  const payload=JSON.stringify({name:'PORSCHE 911 CARRERA RS 2.7',brand:'Hot Wheels',category:'Miniaturas',notes:'TH visível',visibleText:'HOT WHEELS, 208/250',confidence:'high',details:{manufacturer:'Porsche',series:'Then and Now',seriesNumber:'9/10',collectionNumber:'208/250',year:null,scale:null,color:null,condition:'Lacrado na cartela'}})
  const result=parseKieSuggestion(payload)
  expect(result.details.scale).toBe('')
  expect(result.details.color).toBe('')
  expect(result.details.seriesNumber).toBe('9/10')
  expect(parseKieSuggestion(JSON.stringify(payload)).name).toBe(result.name)
 })
})
