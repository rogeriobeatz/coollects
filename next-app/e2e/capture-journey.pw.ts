import { test, expect } from '@playwright/test'
import { resolve } from 'node:path'
import { mockAcervo, backendUrl } from './helpers/acervo'

const photo=resolve(process.cwd(),'e2e/fixtures/image2.jpg')
const extra=resolve(process.cwd(),'e2e/fixtures/image3.jpg')

test('Cadastro com IA: carregamento guiado, foto extra e ficha preenchida',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 const state=await mockAcervo(page,{emptyItems:true})
 const uploads:string[]=[]
 await page.route(backendUrl+'/storage/v1/object/coollects-items/**',route=>{
  const key=new URL(route.request().url()).pathname.split('/coollects-items/')[1]
  uploads.push(key)
  return route.fulfill({json:{Key:'coollects-items/'+key,Id:key}})
 })
 let answer:()=>void=()=>{}
 const answered=new Promise<void>(done=>{answer=done})
 await page.route('**/api/recognize',async route=>{
  await answered
  await route.fulfill({json:{suggestion:{name:"'85 Honda City Turbo II",brand:'Hot Wheels',category:'Miniaturas',notes:'',visibleText:'',confidence:'high',details:{manufacturer:'Honda',series:'Compact Kings',seriesNumber:'4/10',collectionNumber:'105/250',year:null,scale:'',color:'',condition:''}}}})
 })
 await page.goto('/cadastrar')
 test.skip(await page.getByText('temporariamente indisponível').isVisible(),'Build sem KIE_API_KEY: IA desabilitada')

 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles(photo)
 const progress=page.getByRole('region',{name:'Identificando seu item'})
 await expect(progress).toBeVisible()
 await expect(page.getByRole('button',{name:'Aguardando a análise…'})).toBeDisabled()
 // The person can stay productive while the AI works.
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles(extra)
 await expect(page.getByRole('list',{name:'Fotos do item'}).getByRole('listitem')).toHaveCount(2)
 await progress.getByRole('button',{name:'Escolher coleções'}).click()
 await page.getByLabel('Minha garagem',{exact:true}).check()

 answer()
 await expect(page.getByText(/A IA preencheu 6 campo/)).toBeVisible()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue("'85 Honda City Turbo II")
 await expect(page.getByLabel('Série',{exact:true})).toHaveValue('Compact Kings')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)

 await page.getByRole('button',{name:'Salvar no meu acervo',exact:true}).click()
 await expect.poll(()=>state.items.length).toBe(1)
 expect(uploads).toHaveLength(2)
 expect(state.items[0].photo_path).toBe(uploads.find(path=>path===state.items[0].photo_path))
 expect(state.items[0].gallery_paths).toHaveLength(1)
 expect(state.items[0].details?.series).toBe('Compact Kings')
 await expect(page).toHaveURL(/\/item\//)
 const gallery=page.getByRole('region',{name:'Mais fotos'})
 await expect(gallery).toBeVisible()
 await gallery.getByRole('button',{name:'Ampliar foto 1 de 1'}).click()
 await expect(page.getByRole('dialog')).toBeVisible()
})

test('Cadastro com IA: falha permite tentar de novo ou preencher à mão',async({page})=>{
 await page.setViewportSize({width:320,height:700})
 await mockAcervo(page,{emptyItems:true})
 await page.route('**/api/recognize',route=>route.fulfill({status:429,json:{error:'Limite de 10 análises por dia atingido.'}}))
 await page.goto('/cadastrar')
 test.skip(await page.getByText('temporariamente indisponível').isVisible(),'Build sem KIE_API_KEY: IA desabilitada')
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles(photo)
 const alert=page.getByRole('alert').filter({hasText:'Limite de 10'})
 await expect(alert).toBeVisible()
 await expect(alert.getByRole('button',{name:'Tentar de novo'})).toBeVisible()
 await alert.getByRole('button',{name:'Preencher manualmente'}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toBeFocused()
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeEnabled()
})
