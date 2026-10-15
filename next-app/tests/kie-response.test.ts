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
})
