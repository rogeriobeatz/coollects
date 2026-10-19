import { test, expect } from '@playwright/test'

const leaked=/Configure o Supabase|Conecte o Supabase|Supabase ainda n[aã]o configurado|Documento inicial de desenvolvimento|Antes do lan[cç]amento p[uú]blico|Erro de migra[cç][aã]o/i
for(const viewport of [{width:320,height:780},{width:390,height:844}]){
 test.describe('Coollects mobile '+viewport.width+'px',()=>{
  test.use({viewport})
  test('Boas-vindas oferece acesso imediato e não tem rolagem horizontal',async({page})=>{
   await page.goto('/')
   await expect(page.getByRole('heading',{name:/Suas coleções. Suas histórias./i})).toBeVisible()
   await expect(page.locator('.official-logo')).toBeVisible()
   await expect(page.getByRole('link',{name:'Criar conta',exact:true})).toHaveAttribute('href','/registrar?next=/')
   await expect(page.getByRole('link',{name:/Já tenho conta/})).toHaveAttribute('href','/entrar?next=/')
   await page.getByRole('link',{name:'Criar conta',exact:true}).click()
   await expect(page.getByRole('heading',{name:/Comece seu universo/i})).toBeVisible()
   await expect(page.locator('body')).not.toContainText(leaked)
   const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)
   expect(fits).toBe(true)
  })
  test('A navegação entre telas funciona',async({page})=>{
   await page.goto('/')
   await page.getByRole('link',{name:'Explorar coleções',exact:true}).click()
   await expect(page.getByRole('heading',{name:/Explorar universos/i})).toBeVisible()
   await page.getByRole('link',{name:'Coleções'}).last().click()
   await expect(page).toHaveURL(/\/colecoes$/)
   await expect(page.getByRole('heading',{name:/Minhas coleções/i})).toBeVisible()
   await page.getByRole('link',{name:'Explorar'}).last().click()
   await expect(page).toHaveURL(/\/explorar$/)
   await expect(page.getByRole('heading',{name:/Explorar universos/i})).toBeVisible()
   await expect(page.locator('body')).not.toContainText(leaked)
  })
  test('Login tem formulário e não mostra detalhes de infraestrutura',async({page})=>{
   await page.goto('/entrar')
   await expect(page.getByRole('heading',{name:/Bem-vindo de volta/i})).toBeVisible()
   await expect(page.getByLabel('E-mail')).toBeVisible()
   await expect(page.getByLabel('Senha')).toBeVisible()
   await expect(page.locator('body')).not.toContainText(leaked)
  })
  test('Erro 404 possui recuperação para a Home',async({page})=>{
   const res=await page.goto('/url-inexistente-para-testes')
   expect(res?.status()).toBe(404)
   await expect(page.getByRole('heading',{name:/Essa página não está por aqui/i})).toBeVisible()
   await expect(page.getByRole('link',{name:'Voltar ao início'})).toBeVisible()
  })
 })
}

test('PWA oferece ação contextual e campos sem zoom automático',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/colecao/00000000-0000-0000-0000-000000000000')
 await expect(page.getByRole('navigation',{name:'Navegação principal'})).toHaveCount(0)
 await expect(page.getByRole('link',{name:'Criar minha conta grátis'})).toBeVisible()
 await expect(page.getByRole('link',{name:'Entrar',exact:true})).toBeVisible()
 await page.goto('/entrar')
 const font=await page.getByLabel('E-mail').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))
 expect(font).toBeGreaterThanOrEqual(16)
})
