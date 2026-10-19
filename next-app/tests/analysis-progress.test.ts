import {describe,it,expect} from 'vitest'
import {analysisProgress,ANALYSIS_EXPECTED_MS} from '../components/analysis-progress'
import {prompt,parseKieSuggestion} from '../lib/kie-parser'
describe('Barra de análise da IA',()=>{
 it('avança ao longo dos ~20 s esperados sem chegar a 100%',()=>{
  expect(analysisProgress(0,false)).toBe(0)
  expect(analysisProgress(ANALYSIS_EXPECTED_MS/2,false)).toBeGreaterThan(50)
  expect(analysisProgress(ANALYSIS_EXPECTED_MS,false)).toBe(90)
  expect(analysisProgress(120_000,false)).toBeLessThanOrEqual(97)
 })
 it('nunca volta para trás',()=>{
  let last=0
  for(let t=0;t<=60_000;t+=500){const p=analysisProgress(t,false);expect(p).toBeGreaterThanOrEqual(last);last=p}
 })
 it('completa quando a resposta chega',()=>{expect(analysisProgress(3_000,true)).toBe(100)})
})
describe('Prompt de reconhecimento',()=>{
 it('traz o modelo JSON com todas as chaves aceitas pelo parser',()=>{
  const template=prompt.split('\n').find(line=>line.startsWith('{'))!
  const parsed=parseKieSuggestion(template)
  expect(parsed.confidence).toBe('low')
  expect(Object.keys(parsed.details)).toEqual(['manufacturer','series','seriesNumber','collectionNumber','year','scale','color','condition'])
 })
})
