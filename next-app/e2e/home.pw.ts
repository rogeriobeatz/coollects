import { test, expect, type Page } from '@playwright/test'
import {mockAcervo,backendUrl} from './helpers/acervo'

const userId = '00000000-0000-4000-8000-000000000001'
const collectionId = '00000000-0000-4000-8000-000000000002'
const itemId = '00000000-0000-4000-8000-000000000003'
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'colecionador@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { display_name: 'Rogério Silva' }, created_at: '2026-01-01T00:00:00Z' }

// Synthetic credentials match the isolated CI/build server, never a real account.
async function account(page: Page, populated = false, fail = false) {
 await mockAcervo(page,{emptyCollections:!populated,emptyItems:!populated})
 if(fail)await page.route(backendUrl+'/rest/v1/collections*',route=>route.fulfill({status:500,json:{message:'Temporary test failure'}}))
}

for (const width of [320, 390]) {
 test.describe('Home pessoal ' + width + 'px', () => {
  test.use({ viewport: { width, height: 844 } })
  test('Conta vazia abre o feed com a IA em destaque e orienta o primeiro cadastro', async ({ page }) => {
   await account(page)
   await page.goto('/')
   await expect(page.getByRole('heading', { name: 'Olá, Rogério!' })).toBeVisible()
   await expect(page.getByRole('heading', { name: /Qual peça conta/ })).toBeVisible()
   await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
   await expect(page.getByRole('link', { name: 'Catalogar com IA', exact: true })).toHaveAttribute('href', '/cadastrar')
   await expect(page.getByRole('link', { name: 'Notificações', exact: true })).toHaveAttribute('href', '/notificacoes')
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
   await page.getByRole('link', { name: 'Nova coleção', exact: true }).click()
   await expect(page).toHaveURL(/\/colecoes\?criar=1$/)
   await expect(page.getByRole('heading', { name: 'O que vamos colecionar?' })).toBeVisible()
  })
  test('Conta com acervo público vê as próprias postagens no feed', async ({ page }) => {
   await account(page, true)
   await page.goto('/')
   const post=page.getByRole('article',{name:/publicou Carrinho favorito/})
   await expect(post).toBeVisible()
   await expect(post.getByRole('link', { name: 'Carrinho favorito', exact: true })).toHaveAttribute('href', /\/item\/.+\?voltar=inicio$/)
   await expect(post.getByRole('button', { name: 'Compartilhar Carrinho favorito', exact: true })).toBeVisible()
   await expect(page.getByText('Você está em dia')).toBeVisible()
   await expect(page.getByRole('heading', { name: /Qual peça conta/ })).toHaveCount(0)
   await expect(page.getByRole('link', { name: 'Explorar', exact: true })).toHaveAttribute('href','/explorar')
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
 })
}

test('Falha ao buscar o feed oferece nova tentativa sem sugerir conta vazia', async ({ page }) => {
 await account(page, true)
 const pattern=backendUrl+'/rest/v1/rpc/home_feed'
 await page.route(pattern,route=>route.fulfill({status:500,json:{message:'Temporary test failure'}}))
 await page.goto('/')
 await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível carregar seu feed' })).toBeVisible()
 await expect(page.getByRole('heading', { name: /Qual peça conta/ })).toHaveCount(0)
 await page.unroute(pattern)
 await page.getByRole('button', { name: 'Tentar novamente' }).click()
 await expect(page.getByRole('article',{name:/publicou Carrinho favorito/})).toBeVisible()
})

test('Movimento reduzido mantém logo estático e permite entrar', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'reduce' })
 let requestedAnimation = false
 page.on('request', request => { if (request.url().includes('intro-anim.json')) requestedAnimation = true })
 await page.goto('/')
 await expect(page.getByRole('heading', { name: /Suas coleções. Suas histórias./ })).toBeVisible()
 await expect(page.locator('.welcome-logo-static')).toBeVisible()
 expect(requestedAnimation).toBe(false)
 await page.getByRole('link', { name: /Já tenho conta/ }).click()
 await expect(page).toHaveURL(/\/entrar\?next=\/$/)
 await expect(page.getByLabel('E-mail')).toBeVisible()
})

test('Animação original carrega localmente sem bloquear as ações', async ({ page }) => {
 await page.route('**/brand/intro-anim.json', async route => {
  await new Promise(resolve => setTimeout(resolve, 500))
  await route.continue()
 })
 await page.goto('/')
 await expect(page.getByRole('link', { name: 'Criar conta', exact: true })).toBeVisible()
 await expect(page.locator('.welcome-logo-animation svg')).toBeVisible()
 await expect(page.locator('.welcome-logo')).toHaveClass(/is-animated/)
})

test('Emoji personalizado é salvo, reaparece na home e pode voltar ao padrão', async ({ page }) => {
 await account(page,true)
 let collection={id:collectionId,owner_id:userId,name:'Minha garagem',category:'Miniaturas',color:'#6125BF',description:'',is_public:false,emoji:null as string|null}
 await page.route(backendUrl+'/rest/v1/collections*',route=>{
  if(['PATCH','POST'].includes(route.request().method())){
   const payload=route.request().postDataJSON()
   collection={...collection,...payload}
   return route.fulfill({json:{id:collectionId}})
  }
  return route.fulfill({json:[collection],headers:{'Content-Range':'0-0/1'}})
 })
 await page.goto('/colecoes')
 await page.goto('/colecoes?editar='+collectionId)
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Deixe com a sua cara.'})).toBeVisible()
 await page.getByLabel('Ou use outro emoji').fill('🚀🎮')
 await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled()
 await page.getByRole('button',{name:'Usar emoji Foguete',exact:true}).click()
 await expect(page.locator('.collection-preview .art-emoji')).toHaveText('🚀')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page.getByRole('link',{name:'Minha garagem',exact:true})).toBeVisible()
 expect(collection.emoji).toBe('🚀')
 await page.goto('/colecoes')
 await expect(page.locator('.collector-collection-card .art-emoji')).toHaveText('🚀')
 await page.reload()
 await expect(page.locator('.collector-collection-card .art-emoji')).toHaveText('🚀')
 await page.goto('/colecoes')
 await page.goto('/colecoes?editar='+collectionId)
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await expect(page.getByLabel('Ou use outro emoji')).toHaveValue('🚀')
 await page.getByRole('button',{name:'Usar emoji da categoria'}).click()
 await expect(page.locator('.collection-preview .art-emoji')).toHaveText('🏎️')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page.getByRole('link',{name:'Minha garagem',exact:true})).toBeVisible()
 expect(collection.emoji).toBeNull()
 await page.goto('/colecoes')
 await expect(page.locator('.collector-collection-card .art-emoji')).toHaveText('🏎️')
})

test('Nova coleção aceita emoji composto e envia a escolha com os dados',async({page})=>{
 await account(page)
 let payload:Record<string,unknown>|undefined
 await page.route(backendUrl+'/rest/v1/collections*',route=>{
  if(route.request().method()==='POST'){
   payload=route.request().postDataJSON()
   return route.fulfill({json:{id:collectionId}})
  }
  return route.fulfill({json:[]})
 })
 await page.goto('/colecoes?criar=1')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByLabel('Nome da coleção').fill('Histórias em família')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByLabel('Ou use outro emoji').fill('👨‍👩‍👧‍👦')
 await expect(page.locator('.collection-preview .art-emoji')).toHaveText('👨‍👩‍👧‍👦')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page.getByText('Coleção salva e sincronizada!',{exact:true})).toBeVisible()
 expect(payload).toMatchObject({name:'Histórias em família',owner_id:userId,emoji:'👨‍👩‍👧‍👦'})
})
