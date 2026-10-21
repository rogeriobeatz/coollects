import { test, expect } from '@playwright/test'
import { mockAcervo, backendUrl, collectionId, itemId, item, ownerId, visitorId } from './helpers/acervo'

test.beforeEach(async({page})=>{await page.setViewportSize({width:390,height:844})})

test('Dono vê o próprio perfil público com coleções e itens, sem botão de seguir',async({page})=>{
 await mockAcervo(page)
 await page.goto('/u/colecionador_test')
 await expect(page.getByRole('heading',{level:1,name:'Rogério Silva'})).toBeVisible()
 await expect(page.getByRole('link',{name:'Editar perfil',exact:true})).toHaveAttribute('href','/perfil/editar')
 await expect(page.getByRole('button',{name:/^Seguir/})).toHaveCount(0)
 await expect(page.locator('.profile-collection-rail .collector-collection-card').first()).toBeVisible()
 await expect(page.getByRole('link',{name:'Carrinho favorito',exact:true})).toHaveAttribute('href','/item/'+itemId+'?voltar=u%2Fcolecionador_test')
 // Owners see their likes count, never a like control on their own items.
 await expect(page.getByRole('button',{name:/^Curtir /})).toHaveCount(0)
 await page.getByRole('tab',{name:'Itens curtidos'}).click()
 await expect(page.getByRole('heading',{name:'Seus favoritos aparecem aqui'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('Colecionador logado segue, curte e vê a postagem no feed da home',async({page})=>{
 const state=await mockAcervo(page,{viewer:'visitor'})
 await page.goto('/u/colecionador_test')
 const follow=page.locator('.collector-hero').getByRole('button',{name:/Rogério Silva$/})
 await expect(follow).toHaveAccessibleName('Seguir Rogério Silva')
 await follow.click()
 await expect(follow).toHaveAccessibleName('Seguindo Rogério Silva')
 await expect(follow).toHaveAttribute('aria-pressed','true')
 await expect.poll(()=>state.follows).toEqual([{follower_id:visitorId,followed_id:ownerId}])
 await expect(page.getByRole('button',{name:'1 seguidor'})).toBeVisible()
 const like=page.getByRole('button',{name:'Curtir Carrinho favorito · 0 curtidas'})
 await like.click()
 await expect(page.getByRole('button',{name:'Curtir Carrinho favorito · 1 curtida'})).toHaveAttribute('aria-pressed','true')
 await expect.poll(()=>state.likes.length).toBe(1)
 await page.goto('/')
 const post=page.getByRole('article',{name:'Rogério Silva publicou Carrinho favorito'})
 await expect(post).toBeVisible()
 await expect(post.getByRole('button',{name:'Curtir Carrinho favorito · 1 curtida'})).toHaveAttribute('aria-pressed','true')
 await expect(post.getByRole('link',{name:'Ver perfil de Rogério Silva'})).toHaveAttribute('href','/u/colecionador_test')
 await expect(page.getByRole('region',{name:'Colecionadores que você segue'}).getByRole('link',{name:'Ver perfil de Rogério Silva'})).toBeVisible()
 // Posts already in the feed are never repeated as community suggestions.
 await expect(page.getByRole('heading',{name:'Novidades da comunidade'})).toHaveCount(0)
})

test('Notificações mostram novos seguidores e apagam o aviso do sino',async({page})=>{
 await mockAcervo(page)
 const happened=new Date(Date.now()-60000).toISOString()
 await page.route(backendUrl+'/rest/v1/rpc/my_social_activity',route=>route.fulfill({json:[{kind:'follow',actor_id:visitorId,username:'ana_hw',display_name:'Ana Diecast',item_id:null,item_name:null,happened_at:happened,followed_by_me:false}]}))
 await page.goto('/')
 const bell=page.getByRole('link',{name:'Notificações, há novidades'})
 await expect(bell).toBeVisible()
 await bell.click()
 await expect(page.getByRole('region',{name:'Hoje'})).toContainText('Ana Diecast começou a seguir você')
 await expect(page.getByRole('button',{name:'Seguir Ana Diecast'})).toBeVisible()
 await expect(page.getByRole('link',{name:'Notificações',exact:true})).toHaveAttribute('aria-current','page')
 await page.goto('/')
 await expect(page.getByRole('link',{name:'Notificações',exact:true})).toBeVisible()
})

test('Falha ao curtir desfaz a curtida e mantém o erro visível',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 await page.route(backendUrl+'/rest/v1/item_likes*',route=>route.request().method()==='POST'?route.fulfill({status:500,json:{message:'Test failure'}}):route.fallback())
 await page.goto('/colecao/'+collectionId)
 await page.getByRole('button',{name:'Curtir Carrinho favorito · 0 curtidas'}).click()
 await expect(page.getByRole('alert').filter({hasText:'Não foi possível atualizar a curtida'})).toBeVisible()
 await expect(page.getByRole('button',{name:'Curtir Carrinho favorito · 0 curtidas'})).toHaveAttribute('aria-pressed','false')
})

test('Visitante sem conta é convidado a entrar para seguir e curtir',async({page})=>{
 await mockAcervo(page)
 await page.context().clearCookies()
 await page.route(backendUrl+'/auth/v1/user',route=>route.fulfill({status:401,json:{message:'No session'}}))
 await page.goto('/item/'+itemId)
 await expect(page.getByRole('link',{name:'Entre para seguir Rogério Silva'})).toHaveAttribute('href','/entrar?next=%2Fitem%2F'+itemId)
 await expect(page.getByRole('link',{name:/^Entre para curtir Carrinho favorito/})).toBeVisible()
 await expect(page.getByRole('link',{name:'Notificações'})).toHaveCount(0)
 await expect(page.getByRole('link',{name:'Entrar',exact:true})).toHaveAttribute('href','/entrar?next=%2Fitem%2F'+itemId)
})

test('Falha ao seguir restaura o botão e os contadores do perfil',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 await page.route(backendUrl+'/rest/v1/user_follows*',route=>route.request().method()==='POST'?route.fulfill({status:500,json:{message:'Test failure'}}):route.fallback())
 await page.goto('/u/colecionador_test')
 const follow=page.locator('.collector-hero').getByRole('button',{name:'Seguir Rogério Silva',exact:true})
 await follow.click()
 await expect(page.getByRole('alert').filter({hasText:'Não foi possível seguir Rogério Silva'})).toBeVisible()
 await expect(follow).toHaveAttribute('aria-pressed','false')
 await expect(page.getByRole('button',{name:'0 seguidores'})).toBeVisible()
})

test('Abas e conexões funcionam pelo teclado e devolvem o foco',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 await page.goto('/u/colecionador_test')
 const published=page.getByRole('tab',{name:'Itens publicados'})
 const liked=page.getByRole('tab',{name:'Itens curtidos'})
 await published.focus();await page.keyboard.press('ArrowRight')
 await expect(liked).toBeFocused();await expect(liked).toHaveAttribute('aria-selected','true')
 await page.keyboard.press('Home');await expect(published).toBeFocused()
 const followers=page.getByRole('button',{name:'0 seguidores'})
 await followers.click()
 const dialog=page.getByRole('dialog',{name:'Conexões de Rogério Silva'})
 await expect(dialog).toBeVisible()
 await dialog.getByRole('tab',{name:'Seguidores'}).focus()
 await page.keyboard.press('ArrowRight')
 await expect(dialog.getByRole('tab',{name:'Seguindo'})).toBeFocused()
 await expect(dialog).toContainText('Este perfil ainda não segue ninguém.')
 await page.keyboard.press('Escape')
 await expect(dialog).toHaveCount(0);await expect(followers).toBeFocused()
})

test('Comunidade continua após uma página composta só por itens já vistos',async({page})=>{
 await mockAcervo(page)
 const offsets:number[]=[]
 await page.route(backendUrl+'/rest/v1/rpc/community_feed',route=>{
  const offset=route.request().postDataJSON().p_offset;offsets.push(offset)
  return route.fulfill({json:offset===0?Array.from({length:12},()=>item):[{...item,id:'00000000-0000-4000-8000-000000000088',name:'Outra descoberta'}]})
 })
 await page.goto('/')
 await page.getByRole('heading',{name:'Novidades da comunidade'}).scrollIntoViewIfNeeded()
 await expect(page.getByRole('link',{name:'Outra descoberta',exact:true})).toBeVisible()
 expect(offsets).toEqual([0,12])
 await expect(page.getByRole('article',{name:/publicou Carrinho favorito/})).toHaveCount(1)
})

test('Falha na paginação preserva os posts e permite nova tentativa sem loop',async({page})=>{
 await mockAcervo(page)
 let moreRequests=0
 await page.route(backendUrl+'/rest/v1/rpc/home_feed',route=>{
  if(route.request().postDataJSON().p_offset===0)return route.fulfill({json:Array.from({length:12},(_,index)=>({...item,id:'post-'+index,name:'Peça '+index}))})
  moreRequests+=1
  return moreRequests===1?route.fulfill({status:500,json:{message:'Test failure'}}):route.fulfill({json:[]})
 })
 await page.goto('/')
 const more=page.getByRole('button',{name:'Mostrar mais'})
 await more.scrollIntoViewIfNeeded()
 await expect(page.getByRole('alert').filter({hasText:'Não foi possível carregar mais postagens'})).toBeVisible()
 await expect(page.getByRole('link',{name:'Peça 0',exact:true})).toHaveCount(1)
 expect(moreRequests).toBe(1)
 await more.click()
 await expect(page.getByText('Você está em dia')).toBeVisible()
 expect(moreRequests).toBe(2)
})

test('Seguir pela home atualiza posts e colecionadores após o banco confirmar',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 let releaseWrite=()=>{}
 const writePending=new Promise<void>(resolve=>{releaseWrite=resolve})
 await page.route(backendUrl+'/rest/v1/user_follows*',async route=>{
  if(route.request().method()==='POST')await writePending
  await route.fallback()
 })
 await page.goto('/')
 const follow=page.locator('.suggested-collectors').getByRole('button',{name:'Seguir Rogério Silva',exact:true})
 await follow.click()
 await expect(page.locator('.suggested-collectors').getByRole('button',{name:'Seguindo Rogério Silva',exact:true})).toHaveAttribute('aria-pressed','true')
 releaseWrite()
 await expect(page.locator('.home-feed > .feed-list').getByRole('article',{name:'Rogério Silva publicou Carrinho favorito'})).toBeVisible()
 await expect(page.getByRole('region',{name:'Colecionadores que você segue'}).getByRole('link',{name:'Ver perfil de Rogério Silva'})).toBeVisible()
})

test('Curtida removida desaparece da aba de favoritos do próprio perfil',async({page})=>{
 const state=await mockAcervo(page,{viewer:'visitor'})
 state.likes.push({user_id:visitorId,item_id:itemId})
 await page.route(backendUrl+'/rest/v1/profiles*',route=>{
  const profile={id:visitorId,username:'ana_hw',display_name:'Ana Diecast',bio:''}
  return route.fulfill({json:route.request().headers()['accept']?.includes('vnd.pgrst.object')?profile:[profile]})
 })
 await page.goto('/u/ana_hw')
 await page.getByRole('tab',{name:'Itens curtidos'}).click()
 await page.getByRole('button',{name:'Curtir Carrinho favorito · 1 curtida'}).click()
 await expect(page.getByRole('heading',{name:'Seus favoritos aparecem aqui'})).toBeVisible()
 expect(state.likes).toEqual([])
})

test('Erro nas conexões do perfil pode ser recuperado sem inventar contadores',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 const pattern=backendUrl+'/rest/v1/rpc/profile_social_summary'
 await page.route(pattern,route=>route.fulfill({status:500,json:{message:'Test failure'}}))
 await page.goto('/u/colecionador_test')
 const error=page.getByRole('alert').filter({hasText:'Não foi possível carregar as conexões deste perfil'})
 await expect(error).toBeVisible()
 await expect(page.locator('.collector-hero').getByRole('button',{name:/Seguir/})).toHaveCount(0)
 await page.unroute(pattern)
 await error.getByRole('button',{name:'Tentar novamente'}).click()
 await expect(page.locator('.collector-hero').getByRole('button',{name:'Seguir Rogério Silva',exact:true})).toBeVisible()
})

for(const path of ['/item/'+itemId,'/colecao/'+collectionId]){
 test('Falha ao consultar curtidas oferece nova tentativa em '+path,async({page})=>{
  await mockAcervo(page,{viewer:'visitor'})
  const pattern=backendUrl+'/rest/v1/rpc/item_social_summary'
  await page.route(pattern,route=>route.fulfill({status:500,json:{message:'Test failure'}}))
  await page.goto(path)
  const error=page.getByRole('alert').filter({hasText:'Não foi possível carregar as curtidas'})
  await expect(error).toBeVisible()
  await page.unroute(pattern)
  await error.getByRole('button',{name:'Tentar novamente'}).click()
  await expect(page.getByRole('button',{name:'Curtir Carrinho favorito · 0 curtidas'})).toBeVisible()
  await expect(error).toHaveCount(0)
 })
}


test('Falha na atualização do feed mantém posts já exibidos',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 let calls=0
 await page.route(backendUrl+'/rest/v1/rpc/home_feed',route=>{
  calls++
  return calls===2?route.fulfill({status:500,json:{message:'Temporary outage'}}):route.fulfill({json:[item]})
 })
 await page.goto('/')
 const post=page.getByRole('article',{name:'Rogério Silva publicou Carrinho favorito'})
 await expect(post).toBeVisible()
 await page.locator('.suggested-collectors').getByRole('button',{name:'Seguir Rogério Silva',exact:true}).click()
 const warning=page.getByRole('alert').filter({hasText:'Não foi possível atualizar seu feed'})
 await expect(warning).toBeVisible()
 await expect(post).toBeVisible()
 await warning.getByRole('button',{name:'Tentar novamente'}).click()
 await expect(warning).toHaveCount(0)
 await expect(post).toBeVisible()
 expect(calls).toBe(3)
})

test('Falha ao verificar coleção não marca o item como privado',async({page})=>{
 await mockAcervo(page,{viewer:'visitor'})
 const pattern=backendUrl+'/rest/v1/collection_items*'
 await page.route(pattern,route=>route.fulfill({status:500,json:{message:'Temporary outage'}}))
 await page.goto('/item/'+itemId)
 const warning=page.getByRole('alert').filter({hasText:'Não foi possível confirmar a visibilidade deste item'})
 await expect(warning).toBeVisible()
 await expect(page.getByRole('button',{name:/^Curtir Carrinho favorito/})).toHaveCount(0)
 await page.unroute(pattern)
 await warning.getByRole('button',{name:'Tentar novamente'}).click()
 await expect(warning).toHaveCount(0)
 await expect(page.getByRole('button',{name:'Curtir Carrinho favorito · 0 curtidas'})).toBeVisible()
})

test('Alterar coleção mantém o seletor aberto sem interromper a organização',async({page})=>{
 await mockAcervo(page)
 await page.goto('/item/'+itemId)
 await page.getByRole('button',{name:'Adicionar a uma coleção'}).click()
 const dialog=page.getByRole('dialog',{name:'Adicionar item a coleções'})
 await expect(dialog).toBeVisible()
 const option=dialog.getByRole('button',{name:/Minha garagem/})
 await expect(option).toHaveAttribute('aria-pressed','true')
 await option.click()
 await expect(dialog).toBeVisible()
 await expect(option).toHaveAttribute('aria-pressed','false')
 await option.click()
 await expect(dialog).toBeVisible()
 await expect(option).toHaveAttribute('aria-pressed','true')
})

test('Falha de rede ao salvar perfil libera o botão de nova tentativa',async({page})=>{
 await mockAcervo(page)
 await page.goto('/perfil/editar')
 const save=page.getByRole('button',{name:'Salvar perfil'})
 await expect(save).toBeEnabled()
 await page.route(backendUrl+'/rest/v1/profiles*',route=>route.request().method()==='PATCH'?route.abort('failed'):route.fallback())
 await save.click()
 await expect(page.getByRole('status').filter({hasText:'Não foi possível atualizar o perfil'})).toBeVisible()
 await expect(save).toBeEnabled()
})
