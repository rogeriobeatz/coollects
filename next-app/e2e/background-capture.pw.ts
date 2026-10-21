import {test,expect,type Page} from '@playwright/test'
import {mockAcervo,backendUrl,collectionId,itemId} from './helpers/acervo'

const suggestion={name:'Sugestão da IA',brand:'Hot Wheels',category:'Miniaturas',notes:'Observação da IA',visibleText:'',confidence:'high',details:{manufacturer:'Honda',series:'Compact Kings',seriesNumber:'4/10',collectionNumber:'105/250',year:null,scale:'1:64',color:'',condition:''}}

async function pendingAnalysis(page:Page){
 let requests=0,release:()=>void=()=>{}
 const ready=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/api/recognize',async route=>{
  requests++
  await ready
  await route.fulfill({json:{suggestion}}).catch(()=>{/* The user may cancel this request. */})
 })
 return {finish:()=>release(),requests:()=>requests}
}

async function startPhoto(page:Page){
 test.skip(await page.getByText('temporariamente indisponível').isVisible(),'Build sem IA habilitada')
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles('e2e/fixtures/image2.jpg')
 await expect(page.getByRole('region',{name:'Identificando seu item'})).toBeVisible()
}

test.beforeEach(async({page})=>{await page.setViewportSize({width:390,height:844})})

test('Análise termina em outra tela e devolve fotos, ficha e coleção para revisão',async({page})=>{
 const state=await mockAcervo(page,{emptyItems:true})
 const job=await pendingAnalysis(page)
 await page.goto('/cadastrar?colecao='+collectionId)
 await page.getByLabel('Nome do item *',{exact:true}).fill('Nome revisado por mim')
 await page.getByLabel('Marca',{exact:true}).fill('Minha marca')
 await page.locator('.notes-disclosure summary').click()
 await page.getByLabel('Observações pessoais (podem ser visíveis em coleções públicas)').fill('História escrita por mim')
 await startPhoto(page)
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles('e2e/fixtures/image3.jpg')
 await expect(page.getByRole('list',{name:'Fotos do item'}).getByRole('listitem')).toHaveCount(2)
 await expect.poll(()=>page.locator('.scanner-photo').evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
 await page.getByRole('link',{name:'Coleções',exact:true}).click()
 const indicator=page.getByRole('link',{name:'Retomar cadastro — Reconhecendo foto',exact:true})
 await expect(indicator).toBeVisible()
 await expect(indicator).toHaveClass(/is-working/)
 await page.getByRole('button',{name:'Criar coleção',exact:true}).focus()
 job.finish()
 const ready=page.getByRole('link',{name:'Retomar cadastro — Pronto para revisar',exact:true})
 await expect(ready).toBeVisible()
 await expect(page).toHaveURL(/\/colecoes$/)
 await expect(page.getByRole('button',{name:'Criar coleção',exact:true})).toBeFocused()
 expect(state.items).toHaveLength(0)
 await ready.click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Nome revisado por mim')
 await expect(page.getByLabel('Marca',{exact:true})).toHaveValue('Minha marca')
 await expect(page.getByLabel('Minha garagem',{exact:true})).toBeChecked()
 await expect(page.getByLabel('Montadora',{exact:true})).toHaveValue('Honda')
 await expect(page.getByLabel('Observações pessoais (podem ser visíveis em coleções públicas)')).toHaveValue('História escrita por mim')
 await expect(page.getByRole('list',{name:'Fotos do item'}).getByRole('listitem')).toHaveCount(2)
 expect(job.requests()).toBe(1)
 await page.getByRole('button',{name:'Salvar no meu acervo',exact:true}).click()
 await expect(page).toHaveURL(new RegExp('/item/'+itemId+'$'))
 expect(state.items).toHaveLength(1)
 expect(state.items[0].gallery_paths).toHaveLength(1)
 await page.getByRole('link',{name:'Adicionar',exact:true}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('')
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeEnabled()
})

test('Retomar durante a análise não reinicia a requisição e aceita continuar manualmente',async({page})=>{
 await mockAcervo(page)
 const job=await pendingAnalysis(page)
 await page.goto('/cadastrar')
 await startPhoto(page)
 await page.getByRole('link',{name:'Itens',exact:true}).click()
 await page.getByRole('link',{name:'Retomar cadastro — Reconhecendo foto',exact:true}).click()
 await expect(page.getByRole('region',{name:'Identificando seu item'})).toBeVisible()
 expect(job.requests()).toBe(1)
 await page.getByRole('button',{name:'Continuar manualmente',exact:true}).click()
 await page.getByLabel('Nome do item *',{exact:true}).fill('Cadastro manual')
 job.finish()
 await page.getByRole('link',{name:'Coleções',exact:true}).click()
 await page.getByRole('link',{name:'Retomar cadastro — Cadastro em andamento',exact:true}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Cadastro manual')
 await expect(page.getByRole('button',{name:'Remover foto 1',exact:true})).toBeVisible()
 expect(job.requests()).toBe(1)
})

test('Falha em outra tela permanece recuperável com a mesma foto',async({page})=>{
 await mockAcervo(page)
 let release:()=>void=()=>{},count=0
 const ready=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/api/recognize',async route=>{
  count++
  if(count===1){await ready;await route.fulfill({status:502,json:{error:'Serviço indisponível.'}})}
  else await route.fulfill({json:{suggestion}})
 })
 await page.goto('/cadastrar');await startPhoto(page)
 await page.getByRole('link',{name:'Coleções',exact:true}).click()
 release()
 await page.getByRole('link',{name:'Retomar cadastro — Reconhecimento interrompido',exact:true}).click()
 await expect(page.getByRole('alert').filter({hasText:'Não conseguimos identificar automaticamente.'})).toBeVisible()
 await page.getByRole('button',{name:'Tentar de novo',exact:true}).click()
 await expect(page.getByText(/A IA preencheu .*Confira antes de salvar/)).toBeVisible()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Sugestão da IA')
 expect(count).toBe(2)
})

test('Descartar exige confirmação e uma resposta antiga não preenche um novo cadastro',async({page})=>{
 await mockAcervo(page)
 const job=await pendingAnalysis(page)
 await page.goto('/cadastrar');await startPhoto(page)
 page.once('dialog',dialog=>dialog.dismiss())
 await page.getByRole('button',{name:'Descartar cadastro',exact:true}).click()
 await expect(page.getByRole('button',{name:'Remover foto 1',exact:true})).toBeVisible()
 page.once('dialog',dialog=>dialog.accept())
 await page.getByRole('button',{name:'Descartar cadastro',exact:true}).click()
 await expect(page.getByRole('button',{name:'Remover foto 1',exact:true})).toHaveCount(0)
 await page.getByLabel('Nome do item *',{exact:true}).fill('Outro cadastro')
 job.finish()
 await page.getByRole('link',{name:'Coleções',exact:true}).click()
 await page.getByRole('link',{name:'Retomar cadastro — Cadastro em andamento',exact:true}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Outro cadastro')
})

test('Logout remove o rascunho e ignora o reconhecimento pendente',async({page})=>{
 await mockAcervo(page)
 const job=await pendingAnalysis(page)
 await page.route(backendUrl+'/auth/v1/logout*',route=>route.fulfill({status:204,body:''}))
 await page.goto('/cadastrar');await startPhoto(page)
 await page.getByRole('link',{name:'Perfil',exact:true}).click()
 await page.getByRole('link',{name:'Editar perfil',exact:true}).click()
 await expect(page.getByRole('link',{name:'Retomar cadastro — Reconhecendo foto',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Sair da conta',exact:true}).click()
 await expect(page).toHaveURL(/\/$/)
 job.finish()
 await expect(page.locator('.capture-indicator')).toHaveCount(0)
 await page.getByRole('link',{name:'Já tenho conta · Entrar',exact:true}).click()
 await expect(page.locator('.capture-indicator')).toHaveCount(0)
})

test('Indicador cabe em 320 px, respeita movimento reduzido e funciona pelo teclado',async({page})=>{
 await mockAcervo(page)
 const job=await pendingAnalysis(page)
 await page.setViewportSize({width:320,height:667})
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.goto('/cadastrar');await startPhoto(page)
 await page.getByRole('link',{name:'Itens',exact:true}).click()
 const indicator=page.getByRole('link',{name:'Retomar cadastro — Reconhecendo foto',exact:true})
 await expect(indicator).toBeInViewport()
 const size=await indicator.boundingBox()
 expect(size!.height).toBeGreaterThanOrEqual(44)
 expect(await indicator.locator('.capture-indicator-symbol').evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('none')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await indicator.focus();await page.keyboard.press('Enter')
 await expect(page.getByRole('region',{name:'Identificando seu item'})).toBeVisible()
 job.finish()
})

test('Salvar e continuar navegando não interrompe a outra tela ao concluir',async({page})=>{
 const state=await mockAcervo(page,{emptyItems:true})
 let finish:()=>void=()=>{}
 const done=new Promise<void>(resolve=>{finish=resolve})
 await page.route(backendUrl+'/rest/v1/rpc/create_item_with_details',async route=>{await done;await route.fallback()})
 await page.goto('/cadastrar')
 await page.getByLabel('Nome do item *',{exact:true}).fill('Item salvo em segundo plano')
 await page.getByRole('button',{name:'Salvar no meu acervo',exact:true}).click()
 await page.getByRole('link',{name:'Itens',exact:true}).click()
 await expect(page.getByRole('link',{name:'Retomar cadastro — Salvando item',exact:true})).toBeVisible()
 finish()
 await expect(page.getByRole('link',{name:'Ver item salvo',exact:true})).toBeVisible()
 await expect(page).toHaveURL(/\/itens$/)
 expect(state.items).toHaveLength(1)
 await expect(page.getByRole('link',{name:'Item salvo em segundo plano',exact:true})).toBeVisible()
 await page.getByRole('link',{name:'Ver item salvo',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Item salvo em segundo plano',exact:true})).toBeVisible()
})

test('Atualizar a aba avisa sobre o rascunho que ainda está apenas nesta sessão',async({page})=>{
 await mockAcervo(page)
 await page.goto('/cadastrar')
 await page.getByLabel('Nome do item *',{exact:true}).fill('Preservar nesta sessão')
 await page.getByRole('link',{name:'Itens',exact:true}).click()
 await expect(page.getByRole('link',{name:'Retomar cadastro — Cadastro em andamento',exact:true})).toBeVisible()
 const warning=page.waitForEvent('dialog')
 // A dismissed beforeunload never commits a new navigation, so bound that wait.
 const reload=page.reload({waitUntil:'commit',timeout:1500}).catch(()=>null)
 const dialog=await warning
 expect(dialog.type()).toBe('beforeunload')
 await dialog.dismiss();await reload
 await page.getByRole('link',{name:'Retomar cadastro — Cadastro em andamento',exact:true}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Preservar nesta sessão')
})
