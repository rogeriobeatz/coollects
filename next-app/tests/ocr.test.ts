import {describe,it,expect} from 'vitest'
import {suggestFromOcr,ocrRegions,selectOcrText,extractModelLine,proposedLineRegions,refineOcrModel} from '../lib/ocr'
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
  expect(selected).toContain('PORSCHE 911 CARRERA T')
  expect(selected).toContain('HOT WHEELS')
 })
 it('evita adicionar regiões com confiança muito baixa',()=>{
  expect(selectOcrText([{region:'Nome do modelo',text:'P O RX',confidence:12}])).toBe('')
 })

 it('propõe releitura de blocos detectados sem depender de recortes fixos',()=>{
  const rectangles=proposedLineRegions([
   {left:100,top:1100,width:330,height:25,confidence:82,text:'PORSCHE S11 CARRERA T',source:'Detecção automática'},
   {left:80,top:500,width:400,height:200,confidence:10,text:'ARTE RUÍDO',source:'Detecção automática'},
  ],788,1200)
  expect(rectangles).toHaveLength(1)
  expect(rectangles[0].top).toBeGreaterThan(1000)
 })
 it('corrige S11 somente em contexto Porsche Carrera, preservando outros códigos',()=>{
  expect(refineOcrModel('PORSCHE S11 CARRERA T')).toBe('PORSCHE 911 CARRERA T')
  expect(refineOcrModel('FORD S11 GT')).toBe('FORD S11 GT')
 })

 it('recupera o modelo Porsche da saída real com ruído',()=>{
   const raw='cas 4\nUS vi. |\nPORSCHE $11 CARRERA T 3'
   expect(extractModelLine(raw)).toBe('PORSCHE 911 CARRERA T')
 })
 it('seleciona só texto automotivo e evita ruído da ilustração',()=>{
  const text=selectOcrText([
   {region:'Cartela completa',confidence:52,text:'FAS BN ra O Pá'},
   {region:'Nome do modelo',confidence:42,text:'iad]'},
   {region:'Texto detectado 1',confidence:69,text:'cas 4\nUS vi. |\nPORSCHE $11 CARRERA T 3'},
   {region:'Texto detectado 2',confidence:33,text:'oN v) | — = h ='},
   {region:'Texto detectado 3',confidence:25,text:'NW |e 22)'},
  ])
  expect(text.trim()).toBe('PORSCHE 911 CARRERA T')
 })

})
