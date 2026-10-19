import { test, expect } from '@playwright/test'
import { mockAcervo, collectionId, itemId } from './helpers/acervo'

test.beforeEach(async({page})=>{await page.setViewportSize({width:390,height:844})})

test('Compartilhar abre a folha nativa do celular com título e link',async({page})=>{
 await page.addInitScript(()=>{
  const w=window as unknown as {__shared?:ShareData}
  Object.defineProperty(navigator,'share',{configurable:true,value:async(data:ShareData)=>{w.__shared=data}})
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true})
 })
 await mockAcervo(page)
 await page.goto('/colecao/'+collectionId)
 await page.getByRole('button',{name:'Compartilhar coleção',exact:true}).click()
 const shared=await page.evaluate(()=>(window as unknown as {__shared?:ShareData}).__shared)
 expect(shared?.title).toBe('Minha garagem')
 expect(shared?.url).toMatch(new RegExp('/colecao/'+collectionId+'$'))
 await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('Sem folha nativa, o app oferece copiar link e apps de mensagem',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined})})
 await mockAcervo(page)
 await page.goto('/item/'+itemId)
 await page.getByRole('button',{name:'Compartilhar',exact:true}).click()
 const sheet=page.getByRole('dialog',{name:'Compartilhar Carrinho favorito'})
 await expect(sheet).toBeVisible()
 await expect(sheet.getByRole('button',{name:'Copiar link'})).toBeFocused()
 await expect(sheet.getByRole('link',{name:'WhatsApp'})).toHaveAttribute('href',/^https:\/\/wa\.me\/\?text=.*item/)
 await expect(sheet.getByRole('textbox')).toHaveValue(new RegExp('/item/'+itemId+'$'))
 await page.keyboard.press('Escape')
 await expect(sheet).toHaveCount(0)
})

test('Coleção privada: compartilhar guia a publicação antes do link',async({page})=>{
 const state=await mockAcervo(page)
 state.collections[0].is_public=false
 await page.goto('/colecao/'+collectionId)
 await expect(page.getByRole('switch',{name:'Coleção pública'})).toHaveAttribute('aria-checked','false')
 await page.getByRole('button',{name:'Compartilhar coleção',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Compartilhar coleção privada'})
 await dialog.getByRole('button',{name:'Tornar pública'}).click()
 await expect(dialog.getByRole('button',{name:'Compartilhar agora'})).toBeVisible()
 expect(state.collections[0].is_public).toBe(true)
 await expect(page.getByRole('switch',{name:'Coleção pública'})).toHaveAttribute('aria-checked','true')
})

test('Acervo vazio mostra ilustração e caminho para o primeiro item',async({page})=>{
 await mockAcervo(page,{emptyItems:true})
 await page.goto('/itens')
 await expect(page.locator('.empty-illustration-first-item')).toBeVisible()
 await expect(page.getByRole('link',{name:'Cadastrar item',exact:true})).toBeVisible()
})

test('Salvar e cadastrar outro mantém a coleção e limpa a ficha',async({page})=>{
 const state=await mockAcervo(page,{emptyItems:true})
 await page.goto('/cadastrar?colecao='+collectionId)
 await expect(page.getByLabel('Minha garagem',{exact:true})).toBeChecked()
 await page.getByLabel('Nome do item *',{exact:true}).fill('Primeira miniatura')
 await page.getByRole('button',{name:'Salvar e cadastrar outro',exact:true}).click()
 await expect(page.getByRole('status').filter({hasText:'“Primeira miniatura” salvo!'})).toBeVisible()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('')
 await expect(page.getByLabel('Minha garagem',{exact:true})).toBeChecked()
 expect(state.items).toHaveLength(1)
 await expect(page.getByRole('link',{name:'Ver item',exact:true})).toHaveAttribute('href','/item/'+itemId)
})

test('Edição agrupa detalhes e permite gerenciar fotos extras',async({page})=>{
 await mockAcervo(page)
 await page.goto('/itens?editar='+itemId)
 const editor=page.getByRole('dialog',{name:'Editar item',exact:true})
 await expect(editor.getByLabel('Montadora',{exact:true})).toBeVisible()
 await expect(editor.getByLabel('Escala',{exact:true})).toBeHidden()
 await editor.getByText('Mais detalhes da cartela').click()
 await expect(editor.getByLabel('Escala',{exact:true})).toBeVisible()
 await expect(editor.getByText('Fotos extras (0/4)')).toBeVisible()
 await editor.getByLabel('Adicionar fotos extras').setInputFiles('e2e/fixtures/image3.jpg')
 await expect(editor.getByText('Fotos extras (1/4)')).toBeVisible()
 await editor.getByRole('button',{name:'Remover nova foto 1'}).click()
 await expect(editor.getByText('Fotos extras (0/4)')).toBeVisible()
})
