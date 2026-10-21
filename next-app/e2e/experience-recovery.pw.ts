import {test,expect} from '@playwright/test'
import {mockAcervo,backendUrl,collectionId,itemId,item,ownerId} from './helpers/acervo'

test.beforeEach(async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.route('**/api/recognize',route=>route.fulfill({status:502,json:{error:'Tente preencher manualmente.'}}))
})

test('Falha nas coleções não vira vazio; recuperar mantém vínculo e categoria',async({page})=>{
 const state=await mockAcervo(page);state.collections[0].category='Cartas'
 let failed=true
 await page.route(backendUrl+'/rest/v1/collections*',route=>failed?route.fulfill({status:500,json:{message:'offline'}}):route.fallback())
 await page.goto('/cadastrar?colecao='+collectionId)
 await expect(page.getByText('Não foi possível carregar suas coleções. Tente novamente antes de salvar.')).toBeVisible()
 await expect(page.getByText('Você ainda não tem coleções.')).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeDisabled()
 failed=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click()
 await expect(page.getByLabel('Minha garagem',{exact:true})).toBeChecked()
 await expect(page.getByRole('combobox',{name:'Categoria',exact:true})).toHaveValue('Cartas')
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeEnabled()
})

test('Coleção criada na mesma tela mantém a ficha e a fotografia',async({page})=>{
 await mockAcervo(page,{emptyCollections:true})
 await page.goto('/cadastrar')
 await page.getByLabel('Nome do item *',{exact:true}).fill('Minha carta favorita')
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles('e2e/fixtures/image2.jpg')
 await expect(page.locator('.photo-strip .photo-thumb').first()).toBeVisible()
 await page.getByRole('button',{name:'Criar coleção',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Nova coleção',exact:true})
 await dialog.getByLabel('Nome da coleção').fill('Cartas especiais')
 await dialog.getByRole('button',{name:'Criar coleção',exact:true}).click()
 await expect(dialog).toHaveCount(0)
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Minha carta favorita')
 await expect(page.getByLabel('Cartas especiais',{exact:true})).toBeChecked()
 await expect(page.getByRole('button',{name:'Remover foto 1',exact:true})).toBeVisible()
})

test('Navegar com cadastro preenchido mantém o rascunho e permite retomá-lo',async({page})=>{
 await mockAcervo(page);await page.goto('/cadastrar')
 await page.getByLabel('Nome do item *',{exact:true}).fill('Não perder')
 await page.getByRole('link',{name:'Coleções',exact:true}).click()
 await expect(page).toHaveURL(/\/colecoes$/)
 await page.getByRole('link',{name:'Retomar cadastro — Cadastro em andamento',exact:true}).click()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Não perder')
})

test('Coleção de origem removida permite escolher conscientemente salvar sem vínculo',async({page})=>{
 await mockAcervo(page,{emptyCollections:true})
 await page.goto('/cadastrar?colecao='+collectionId)
 await expect(page.getByText('A coleção de origem não está disponível. Escolha outra coleção ou salve sem vínculo.')).toBeVisible()
 await page.getByRole('button',{name:'Continuar sem a coleção de origem',exact:true}).click()
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeEnabled()
})

test('Retomar vínculo após falha não cria outra coleção',async({page})=>{
 const state=await mockAcervo(page,{emptyCollections:true})
 let fail=true
 await page.route(backendUrl+'/rest/v1/collection_items*',route=>fail&&route.request().method()==='POST'?route.fulfill({status:503,json:{message:'offline'}}):route.fallback())
 await page.goto('/colecoes?criar=1&voltar=item/'+itemId)
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByLabel('Nome da coleção').fill('Uma só coleção')
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Continuar',exact:true}).click()
 await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page.getByText(/Coleção criada, mas não foi possível adicionar/)).toBeVisible()
 expect(state.collections).toHaveLength(1)
 fail=false;await page.getByRole('button',{name:'Salvar coleção',exact:true}).click()
 await expect(page).toHaveURL(new RegExp('/item/'+itemId+'$'))
 expect(state.collections).toHaveLength(1)
 expect(state.links).toEqual([{collection_id:collectionId,item_id:itemId}])
})

test('Falha das fotos extras preserva seleção e permite concluir a tentativa',async({page})=>{
 const state=await mockAcervo(page)
 let fail=true
 await page.route(backendUrl+'/rest/v1/items*',route=>fail&&route.request().method()==='PATCH'?route.fulfill({status:503,json:{message:'offline'}}):route.fallback())
 await page.goto('/itens?editar='+itemId)
 const editor=page.getByRole('dialog',{name:'Editar item',exact:true})
 await editor.getByLabel('Nome',{exact:true}).fill('Ficha atualizada')
 await editor.getByLabel('Adicionar fotos extras',{exact:true}).setInputFiles('e2e/fixtures/image2.jpg')
 await editor.getByRole('button',{name:'Salvar alterações',exact:true}).click()
 await expect(editor.getByRole('alert')).toContainText('Suas fotos continuam selecionadas')
 await expect(editor.getByRole('button',{name:'Remover nova foto 1',exact:true})).toBeVisible()
 expect(state.items[0].name).toBe('Ficha atualizada')
 fail=false;await editor.getByRole('button',{name:'Salvar alterações',exact:true}).click()
 await expect(editor).toHaveCount(0)
 expect(state.items[0].gallery_paths).toHaveLength(1)
})

test('Editor de perfil e coleção recuperam erros de leitura',async({page})=>{
 await mockAcervo(page)
 let fail=true
 await page.route(backendUrl+'/rest/v1/profiles*',route=>fail?route.fulfill({status:500,json:{message:'offline'}}):route.fallback())
 await page.goto('/perfil/editar')
 await expect(page.getByRole('alert').filter({hasText:'Não conseguimos carregar o perfil agora.'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Salvar perfil',exact:true})).toBeDisabled()
 fail=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click()
 await expect(page.getByLabel('Nome de exibição')).toHaveValue('Rogério Silva')
 fail=true
 await page.route(backendUrl+'/rest/v1/collections*',route=>fail?route.fulfill({status:500,json:{message:'offline'}}):route.fallback())
 await page.goto('/colecao/'+collectionId)
 await expect(page.getByRole('heading',{name:'Não foi possível abrir a coleção.'})).toBeVisible()
 fail=false;await page.getByRole('button',{name:'Tentar novamente',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Minha garagem'})).toBeVisible()
})

test('Busca pública encontra além de 60 coleções e pagina sem perder resultados',async({page})=>{
 const state=await mockAcervo(page)
 state.collections=Array.from({length:65},(_,i)=>({...state.collections[0],id:i===0?collectionId:crypto.randomUUID(),name:i===64?'Universo antigo':'Acervo '+i}))
 await page.goto('/explorar')
 await expect(page.locator('.explore-grid .collection-card-shell')).toHaveCount(24)
 await page.getByRole('button',{name:'Mostrar mais coleções',exact:true}).click()
 await expect(page.locator('.explore-grid .collection-card-shell')).toHaveCount(48)
 await page.getByLabel('Buscar coleções públicas').fill('Universo antigo')
 await expect(page.getByRole('link',{name:'Universo antigo',exact:true})).toBeVisible()
 await expect(page.locator('.explore-grid .collection-card-shell')).toHaveCount(1)
 await page.getByLabel('Buscar coleções públicas').fill('Rogério')
 await expect(page.locator('.explore-grid .collection-card-shell')).toHaveCount(24)
 await page.getByRole('button',{name:'Cartas',exact:true}).click()
 await expect(page.getByText('Nenhuma coleção corresponde à busca.')).toBeVisible()
})

test('Acervo grande mantém busca completa e limita os cards renderizados',async({page})=>{
 const state=await mockAcervo(page)
 state.items=Array.from({length:405},(_,i)=>({...item,id:crypto.randomUUID(),name:i===404?'Última raridade':'Peça '+i,owner_id:ownerId}))
 state.links=[]
 await page.goto('/itens')
 await expect(page.locator('.cc-item-card')).toHaveCount(48)
 await expect(page.locator('.items-summary')).toContainText('405 itens')
 await page.getByLabel('Buscar no meu acervo').fill('Última raridade')
 await expect(page.getByRole('link',{name:'Última raridade',exact:true})).toBeVisible()
})

test('Compartilhar item privado conduz à publicação e compartilha o item original',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}))
 const state=await mockAcervo(page);state.collections[0].is_public=false
 await page.goto('/item/'+itemId)
 await page.getByRole('button',{name:'Compartilhar',exact:true}).click()
 await page.getByRole('link',{name:'Publicar “Minha garagem” e compartilhar',exact:true}).click()
 const publish=page.getByRole('dialog',{name:'Compartilhar coleção privada'})
 await publish.getByRole('button',{name:'Tornar pública',exact:true}).click()
 await publish.getByRole('button',{name:'Compartilhar agora',exact:true}).click()
 const share=page.getByRole('dialog',{name:'Compartilhar Carrinho favorito'})
 await expect(share.getByRole('textbox')).toHaveValue(new RegExp('/item/'+itemId+'$'))
 expect(state.collections[0].is_public).toBe(true)
})

test('Visitantes que chegam por link voltam para a descoberta',async({page,context})=>{
 await mockAcervo(page);await context.clearCookies()
 await page.route(backendUrl+'/auth/v1/user',route=>route.fulfill({status:401,json:{message:'no session'}}))
 for(const path of ['/item/'+itemId,'/colecao/'+collectionId]){
  await page.goto(path)
  await expect(page.getByRole('link',{name:'Entrar',exact:true})).toBeVisible()
  await expect(page.getByRole('link',{name:'Voltar',exact:true})).toHaveAttribute('href','/explorar')
 }
})

test('Continuar manualmente interrompe a espera sem aceitar uma resposta tardia',async({page})=>{
 await mockAcervo(page)
 let answer:()=>void=()=>{}
 const ready=new Promise<void>(resolve=>{answer=resolve})
 await page.route('**/api/recognize',async route=>{await ready;await route.fulfill({json:{suggestion:{name:'Resposta tardia',brand:'',category:'Miniaturas',notes:'',visibleText:'',confidence:'high'}}}).catch(()=>{})})
 await page.goto('/cadastrar')
 test.skip(await page.getByText('temporariamente indisponível').isVisible(),'Build sem IA habilitada')
 await page.getByLabel('Escolher foto',{exact:true}).setInputFiles('e2e/fixtures/image2.jpg')
 await page.getByRole('button',{name:'Continuar manualmente',exact:true}).click()
 await page.getByLabel('Nome do item *',{exact:true}).fill('Preenchido por mim')
 answer()
 await expect(page.getByRole('button',{name:'Salvar no meu acervo',exact:true})).toBeEnabled()
 await expect(page.getByLabel('Nome do item *',{exact:true})).toHaveValue('Preenchido por mim')
 await expect(page.getByRole('region',{name:'Identificando seu item'})).toHaveCount(0)
})

test('Reimportação após falha não sobrescreve nome ou foto de um item existente',async({page})=>{
 const state=await mockAcervo(page)
 await page.addInitScript(({collectionId,itemId})=>{
  localStorage.setItem('coollects.collections.prototype.v1',JSON.stringify([{id:collectionId,name:'Coleção antiga',category:'Miniaturas',color:'#6125BF',description:''}]))
  localStorage.setItem('coollects.items.prototype.v1',JSON.stringify([{id:itemId,name:'Nome antigo',category:'Miniaturas',brand:'Matchbox',notes:'',collectionId}]))
 },{collectionId,itemId})
 let fail=true
 const conflictPolicies:string[]=[]
 for(const table of ['items','collections'])await page.route(backendUrl+'/rest/v1/'+table+'*',route=>{
  if(route.request().method()!=='POST')return route.fallback()
  const policy=route.request().headers().prefer||'';conflictPolicies.push(policy)
  if(table==='items'&&!policy.includes('resolution=ignore-duplicates'))Object.assign(state.items[0],route.request().postDataJSON())
  return route.fulfill({json:[]})
 })
 await page.route(backendUrl+'/rest/v1/collection_items*',route=>fail&&route.request().method()==='POST'?route.fulfill({status:500,json:{message:'failed'}}):route.fallback())
 page.on('dialog',dialog=>dialog.accept())
 await page.goto('/perfil/editar')
 await page.getByRole('button',{name:'Importar dados locais',exact:true}).click()
 await expect(page.getByText(/Não foi possível concluir a importação/)).toBeVisible()
 state.items[0].name='Nome editado na conta';state.items[0].photo_path=ownerId+'/preservada.jpg'
 fail=false;await page.getByRole('button',{name:'Importar dados locais',exact:true}).click()
 await expect(page.getByText(/Importação deste navegador concluída/)).toBeVisible()
 expect(state.items[0].name).toBe('Nome editado na conta')
 expect(state.items[0].photo_path).toBe(ownerId+'/preservada.jpg')
 expect(conflictPolicies.every(policy=>policy.includes('resolution=ignore-duplicates'))).toBe(true)
})
