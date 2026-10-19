import {test,expect,type Locator,type Page} from '@playwright/test'
import {mockAcervo,item,itemId,collectionId} from './helpers/acervo'

async function expectKeyboardContained(page:Page,dialog:Locator){
 const controls=dialog.locator('button:enabled,input:not([type=hidden]):enabled,select:enabled,textarea:enabled,a[href]').filter({visible:true})
 await controls.last().focus()
 await page.keyboard.press('Tab')
 await expect(controls.first()).toBeFocused()
 await page.keyboard.press('Shift+Tab')
 await expect(controls.last()).toBeFocused()
}

test('Editor, organização e exclusão de item contêm o foco e devolvem ao card',async({page})=>{
 await mockAcervo(page)
 await page.goto('/itens')
 const trigger=page.getByRole('button',{name:'Ações de '+item.name,exact:true})
 for(const [action,label] of [['Editar','Editar item'],['Adicionar a coleção','Adicionar item a coleções'],['Excluir','Confirmar exclusão de item']]){
  await trigger.click()
  await page.getByRole('button',{name:action,exact:true}).click()
  const dialog=page.getByRole('dialog',{name:label,exact:true})
  await expect(dialog).toBeVisible()
  await expect.poll(()=>dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true)
  if(action==='Editar')await expect(dialog.getByLabel('Nome',{exact:true})).toBeFocused()
  if(action==='Excluir')await expect(dialog.getByRole('button',{name:'Cancelar',exact:true})).toBeFocused()
  await expectKeyboardContained(page,dialog)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
 }
})

test('Confirmações de coleção e conta permitem cancelar pelo teclado',async({page})=>{
 await mockAcervo(page)
 await page.goto('/colecoes?excluir='+collectionId)
 const collectionDialog=page.getByRole('dialog',{name:'Confirmar exclusão da coleção',exact:true})
 await expect(collectionDialog.getByRole('button',{name:'Cancelar',exact:true})).toBeFocused()
 await expectKeyboardContained(page,collectionDialog)
 await page.keyboard.press('Escape')
 await expect(collectionDialog).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Criar coleção',exact:true})).toBeFocused()
 await page.goto('/perfil')
 const trigger=page.getByRole('button',{name:'Excluir minha conta',exact:true})
 await trigger.click()
 const accountDialog=page.getByRole('dialog',{name:'Excluir conta',exact:true})
 await expect(accountDialog.getByRole('button',{name:'Cancelar exclusão',exact:true})).toBeFocused()
 await expectKeyboardContained(page,accountDialog)
 await page.keyboard.press('Escape')
 await expect(accountDialog).toHaveCount(0)
 await expect(trigger).toBeFocused()
})

for(const width of [320,390,550]){
 test('Cards legíveis, com cores contrastantes e nomes longos em '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844})
  const state=await mockAcervo(page)
  state.items=['Laranja','Rosa','Dourado','Verde','Cinza','Branco','Preto'].map((color,index)=>({...item,id:index===0?itemId:'00000000-0000-4000-8000-'+String(index+10).padStart(12,'0'),name:'Porsche 911 Carrera edição especial com nome longo',details:{color,manufacturer:'Porsche',scale:'1:64',series:'Uma série especial com nome longo',seriesNumber:'10/10',collectionNumber:'250/250',year:2026,engine:'Seis cilindros',power:'210 cv'}}))
  await page.goto('/itens')
  const cards=page.locator('.cc-view-items .cc-item-card')
  await expect(cards).toHaveCount(7)
  for(const card of await cards.all()){
   const contrast=await card.evaluate(el=>{
    function luminance(value:string){const channels=value.match(/[\d.]+/g)!.slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722}
    const style=getComputedStyle(el),a=luminance(style.color),b=luminance(style.backgroundColor)
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
   })
   expect(contrast).toBeGreaterThanOrEqual(4.5)
  }
  for(const selector of ['.cc-card-eyebrow>span','.cc-card-subline','.cc-mini-chips>span','.cc-card-signature','.cc-photo-category']){
   expect(await cards.first().locator(selector).first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12)
  }
  const placeholder=await cards.first().locator('.cc-item-no-photo small').boundingBox()
  const badge=await cards.first().locator('.cc-photo-category').boundingBox()
  expect(placeholder!.y+placeholder!.height).toBeLessThanOrEqual(badge!.y)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(await cards.evaluateAll(elements=>elements.every(el=>el.scrollWidth<=el.clientWidth))).toBe(true)
  await page.screenshot({path:'.next/artifacts/p1-cards-'+width+'.png',fullPage:true})
  await page.getByRole('button',{name:/^Gearhead/}).click()
  await expect(page.locator('.cc-technical-face')).toHaveCount(7)
  expect(await cards.evaluateAll(elements=>elements.every(el=>el.scrollWidth<=el.clientWidth))).toBe(true)
  await page.goto('/item/'+itemId)
  await expect(page.locator('.item-flip-front .cc-item-title')).toBeVisible()
  await page.getByRole('button',{name:'Virar card',exact:true}).click()
  await expect(page.locator('.item-flip-back .cc-item-title')).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 })
}
