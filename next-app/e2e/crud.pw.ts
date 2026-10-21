import { test, expect } from '@playwright/test'
import { mockAcervo, collectionId, itemId } from './helpers/acervo'

for(const width of [320,390]){
 test('Cards de coleção usam o mesmo padrão 5:3 em todas as listas: '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844})
  await mockAcervo(page)
  for(const path of ['/perfil','/colecoes','/explorar','/u/colecionador_test']){
   await page.goto(path)
   const card=page.locator('.collector-collection-card').first()
   await expect(card).toBeVisible()
   await expect(card.getByRole('img',{name:'Coleção'})).toBeVisible()
   const size=await card.boundingBox()
   expect(Math.abs(size!.width-size!.height*5/3)).toBeLessThan(1)
   expect(await card.evaluate(element=>getComputedStyle(element).borderRadius)).toBe(path==='/colecoes'?'24px':'16px')
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
 })
}

test('Coleção: criar, abrir, editar e excluir preservando os itens',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 const state=await mockAcervo(page,{emptyCollections:true})
 await page.goto('/colecoes?criar=1')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByLabel('Nome da coleção').fill('Minha nova coleção')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Usar emoji Foguete',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await page.getByRole('link',{name:'Minha nova coleção',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Minha nova coleção',exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Editar coleção',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByLabel('Nome da coleção').fill('Coleção atualizada')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page.getByRole('link',{name:'Coleção atualizada',exact:true})).toBeVisible()
 state.links.push({collection_id:collectionId,item_id:itemId})
 await page.getByRole('link',{name:'Coleção atualizada',exact:true}).click()
 await page.getByRole('button',{name:'Mais opções da coleção'}).click()
 await page.getByRole('link',{name:'Excluir coleção',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Confirmar exclusão da coleção'})
 await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
 expect(state.collections).toHaveLength(1)
 await page.getByRole('link',{name:'Coleção atualizada',exact:true}).click()
 await page.getByRole('button',{name:'Mais opções da coleção'}).click()
 await page.getByRole('link',{name:'Excluir coleção',exact:true}).click()
 await dialog.getByRole('button',{name:'Excluir coleção',exact:true}).click()
 await expect(dialog).not.toBeVisible()
 expect(state.collections).toHaveLength(0)
 expect(state.items).toHaveLength(1)
 expect(state.links).toHaveLength(0)
 await page.goto('/itens')
 await expect(page.getByRole('link',{name:'Carrinho favorito',exact:true})).toBeVisible()
})

test('Item: cadastrar, visualizar, editar e excluir sem apagar a coleção',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 const state=await mockAcervo(page,{emptyItems:true})
 await page.goto('/cadastrar')
 await page.getByLabel('Nome do item *',{exact:true}).fill('Meu primeiro item')
 await page.getByLabel('Marca',{exact:true}).fill('Nintendo')
 await page.getByRole('combobox',{name:'Categoria',exact:true}).selectOption('Games')
 await page.getByLabel('Minha garagem',{exact:true}).check()
 await page.getByRole('button',{name:'Salvar no meu acervo',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Meu primeiro item',exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Editar',exact:true}).click()
 const editor=page.getByRole('dialog',{name:'Editar item',exact:true})
 await editor.getByLabel('Nome',{exact:true}).fill('Meu item atualizado')
 await editor.getByRole('button',{name:'Salvar alterações',exact:true}).click()
 await expect(editor).not.toBeVisible()
 await page.getByRole('link',{name:'Meu item atualizado',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Meu item atualizado',exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Excluir',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Confirmar exclusão de item'})
 await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
 expect(state.items).toHaveLength(1)
 await page.goto('/itens?excluir='+itemId)
 await dialog.getByRole('button',{name:'Excluir item',exact:true}).click()
 await expect(dialog).not.toBeVisible()
 expect(state.items).toHaveLength(0)
 expect(state.collections).toHaveLength(1)
 expect(state.links).toHaveLength(0)
})

test('Excluir sem registro removido mostra erro e permite tentar novamente',async({page})=>{
 const state=await mockAcervo(page)
 state.zeroDelete=true
 for(const [path,id,title,action] of [
  ['/colecoes',collectionId,'Confirmar exclusão da coleção','Excluir coleção'],
  ['/itens',itemId,'Confirmar exclusão de item','Excluir item']
 ]){
  await page.goto(path+'?excluir='+id)
  const dialog=page.getByRole('dialog',{name:title})
  await dialog.getByRole('button',{name:action,exact:true}).click()
  await expect(dialog.getByRole('alert')).toContainText('Não foi possível excluir')
  await expect(dialog.getByRole('button',{name:action,exact:true})).toBeEnabled()
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
 }
 expect(state.collections).toHaveLength(1)
 expect(state.items).toHaveLength(1)
})
