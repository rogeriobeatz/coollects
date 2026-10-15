import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const customerFacing = [
 'components/auth-gate.tsx',
 'components/home-dashboard.tsx',
 'components/explore-showcase.tsx',
 'components/account-form.tsx',
 'components/collection-workspace.tsx',
 'components/scan-workspace.tsx',
 'components/item-library.tsx',
 'components/profile-workspace.tsx',
 'components/public-collection.tsx',
 'components/public-profile.tsx',
 'app/privacidade/page.tsx',
 'app/termos/page.tsx',
 'app/recuperar/page.tsx',
 'app/redefinir/page.tsx',
 'components/launch-hold.tsx'
]
const unacceptable = [
 /configure o supabase/i,
 /supabase (ainda )?n[aã]o configurado/i,
 /conecte o supabase/i,
 /veja o guia de implanta[cç][aã]o/i,
 /verifique a migra[cç][aã]o/i,
 /documento inicial de desenvolvimento/i,
 /antes do lan[cç]amento p[uú]blico/i,
 /termos de uso\s*[—-]\s*vers[aã]o inicial/i,
 /o aplicativo ainda est[aá] em desenvolvimento/i
]
describe('Conformidade dos textos de interface',()=>{
 it.each(customerFacing)('%s não mostra mensagens de engenharia ou placeholders',path=>{
  const src=readFileSync(resolve(process.cwd(),path),'utf8')
  for(const pattern of unacceptable)expect(src, 'Texto inadequado em '+path).not.toMatch(pattern)
 })
 it('o padrão de publicação exige liberação explícita',()=>{
  const root=readFileSync(resolve(process.cwd(),'app/layout.tsx'),'utf8')
  expect(root).toContain("process.env.COOLLECTS_SITE_MODE === 'open'")
  expect(root).toContain('<LaunchHold/>')
 })
 it('a IA só aparece quando o serviço estiver habilitado',()=>{
  const src=readFileSync(resolve(process.cwd(),'components/scan-workspace.tsx'),'utf8')
  expect(src).toContain('aiEnabled&&')
  const route=readFileSync(resolve(process.cwd(),'app/cadastrar/page.tsx'),'utf8')
  expect(route).toContain('KIE_API_KEY')
 })
})
