import { describe,it,expect } from 'vitest'
import {readFileSync,readdirSync} from 'node:fs'
import {resolve,relative,join} from 'node:path'
function walk(folder:string):string[]{
 return readdirSync(folder,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(folder,x.name)):[join(folder,x.name)])
}
const app=resolve(process.cwd(),'app')
const components=resolve(process.cwd(),'components')
const routes=walk(app).filter(x=>/\/page\.tsx$/.test(x)).map(x=>'/'+relative(app,x).replace(/\\/g,'/').replace(/(^|\/)page\.tsx$/,'').replace(/\/page\.tsx$/,''))
const cleanRoutes=routes.map(x=>x==='/page.tsx'||x==='/page'||x==='/'?'/' : x)
function matchesRoute(path:string){
 return cleanRoutes.some(route=>route.replace(/\[(?:\.\.\.)?[^\]]+\]/g,'[^/]+')&&new RegExp('^'+route.replace(/\[(?:\.\.\.)?[^\]]+\]/g,'[^/]+')+'$').test(path))
}
describe('Integridade contextual das rotas',()=>{
 it('todas as páginas possuem caminhos diferentes',()=>expect(new Set(cleanRoutes).size).toBe(cleanRoutes.length))
 it('links literais dos componentes apontam para páginas reais',()=>{
  for(const file of [...walk(components),...walk(app)].filter(x=>/\.(tsx|ts)$/.test(x))){
   const src=readFileSync(file,'utf8')
   const links=[...src.matchAll(/href\s*=\s*["'](\/[^"'?#]*)/g)].map(m=>m[1])
   for(const href of links)expect(matchesRoute(href),file+': '+href+' não existe').toBe(true)
  }
 })
 it('edição de item em coleção tem ida e volta identificáveis',()=>{
  const detail=readFileSync(resolve(components,'public-collection.tsx'),'utf8')
  const library=readFileSync(resolve(components,'item-library.tsx'),'utf8')
  expect(detail).toContain('/itens?editar=')
  expect(detail).toContain('&voltar=')
  expect(library).toContain('params.get(\'editar\')')
  expect(library).toContain('Voltar à coleção')
 })
 it('remoção de coleção não exclui o item original',()=>{
  const src=readFileSync(resolve(components,'public-collection.tsx'),'utf8')
  expect(src).toContain(".from('collection_items').delete()")
  expect(src).not.toContain(".from('items').delete()")
 })
})
