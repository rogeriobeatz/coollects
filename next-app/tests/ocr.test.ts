import {describe,it,expect} from 'vitest'
import {suggestFromOcr,ocrRegions,selectOcrText} from '../lib/ocr'
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
 it('localiza a tarja inferior que contém PORSCHE 911 CARRERA T',()=>{
  const r=ocrRegions(788,1200)
  expect(r[1].top).toBeGreaterThan(900)
  expect(r[1].width).toBeGreaterThan(600)
  expect(r[1].scale).toBe(3)
 })
 it('extrai a identificação legível de uma cartela Hot Wheels 2026',()=>{
  const s=suggestFromOcr('HOT WHEELS\nNEW FOR 2026\n15/250\nFACTORY FRESH\nPORSCHE 911 CARRERA T')
  expect(s.brand).toBe('Hot Wheels')
  expect(s.name).toBe('PORSCHE 911 CARRERA T')
 })
 it('não preenche um modelo inventado quando o OCR falha',()=>{
  const s=suggestFromOcr('FAS\nBN +\nra O Pá\nA A PA v5\npao am 3+ ss')
  expect(s.name).toBe('')
 })
 it('descarta o texto sem sentido da cartela inteira e usa regiões confiáveis',()=>{
  const selected=selectOcrText([
   {region:'Cartela completa',text:'FAS BN ra O Pa',confidence:42},
   {region:'Nome do modelo',text:'PORSCHE S11 CARRERA T',confidence:70},
   {region:'Série e numeração',text:'FACTORY FRESH',confidence:67},
   {region:'Cabeçalho da embalagem',text:'HOT WHEELS',confidence:61},
  ])
  expect(selected).not.toContain('FAS')
  expect(selected).toContain('PORSCHE S11 CARRERA T')
  expect(selected).toContain('HOT WHEELS')
 })
 it('evita adicionar regiões com confiança muito baixa',()=>{
  expect(selectOcrText([{region:'Nome do modelo',text:'P O RX',confidence:12}])).toBe('')
 })

})
