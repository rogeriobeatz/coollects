import {describe,expect,it} from 'vitest'
import {safeAuthNext} from '../lib/auth-redirect'
describe('safeAuthNext',()=>{
 it('preserves application routes with query parameters',()=>expect(safeAuthNext('/cadastrar?colecao=123')).toBe('/cadastrar?colecao=123'))
 it('rejects external and protocol-relative redirects',()=>{
  for(const next of ['https://example.org','//example.org','/\\example.org','/%5c%5cexample.org'])expect(safeAuthNext(next)).toBe('/perfil')
 })
 it('rejects sign-in loops and missing destinations',()=>{
  for(const next of [null,'/entrar','/registrar','/recuperar','/redefinir','/auth/callback'])expect(safeAuthNext(next)).toBe('/perfil')
 })
})
