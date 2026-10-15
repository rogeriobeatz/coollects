import {describe,it,expect} from 'vitest'
import {suggestFromOcr} from '../lib/ocr'
describe('OCR local para miniaturas',()=>{
 it('identifica Hot Wheels e modelo Porsche sem inventar edição',()=>{
  const s=suggestFromOcr('HOT WHEELS\nPORSCHE 911 GT3 RS\n3/10\nMADE IN MALAYSIA')
  expect(s.brand).toBe('Hot Wheels');expect(s.name).toBe('PORSCHE 911 GT3 RS');expect(s.confidence).toBe('medium')
 })
 it('identifica Matchbox sem atribuir modelo não lido',()=>{
  const s=suggestFromOcr('MATCHBOX\nCOLLECT THEM ALL\nAGES 3+')
  expect(s.brand).toBe('Matchbox');expect(s.name).toBe('');expect(s.confidence).toBe('low')
 })
 it('não inventa veículos a partir de texto ilegível',()=>{const s=suggestFromOcr('WARNING\nMADE IN\n9876543210987');expect(s.name).toBe('');expect(s.brand).toBe('')})
})
