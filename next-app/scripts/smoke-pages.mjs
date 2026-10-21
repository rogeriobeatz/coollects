import assert from 'node:assert/strict'

const port=process.argv[2]||'3200'
const root='http://127.0.0.1:'+port
async function wait(){
 for(let i=0;i<60;i++){
  try{const r=await fetch(root+'/');if(r.status<500)return}
  catch{}
  await new Promise(r=>setTimeout(r,500))
 }
 throw new Error('O servidor não iniciou em 30 segundos')
}
await wait()
 const pages=[
  '/', '/entrar','/registrar','/recuperar','/redefinir',
  '/colecoes','/cadastrar','/explorar','/itens','/perfil','/perfil/editar','/notificacoes',
  '/privacidade','/termos','/u/colecionador_qa','/colecao/00000000-0000-0000-0000-000000000000'
 ]
 for(const page of pages){
  const response=await fetch(root+page)
  assert.equal(response.status,200, page+': HTTP '+response.status)
  const html=await response.text()
  assert.match(html,/Coollects/i,page+' sem identidade visível')
  assert.doesNotMatch(html,/O melhor de colecionar|está chegando\./,page+' bloqueada por manutenção')
  assert.doesNotMatch(html,/Configure o Supabase|Supabase ainda não configurado|Conecte o Supabase|Documento inicial de desenvolvimento/i,page+' com texto interno')
  console.log('✓',page)
 }
 const notFound=await fetch(root+'/rota-que-nao-existe')
 assert.equal(notFound.status,404,'Rota inexistente deveria retornar 404')
 console.log('✓ 404')
