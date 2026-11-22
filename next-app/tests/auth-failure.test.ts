import {describe,expect,it} from 'vitest'
import {authFailureMessage} from '../lib/auth-failure'

describe('mensagens do Auth do Coollects',()=>{
 it('explica indisponibilidade temporária quando Supabase bloqueia envios de e-mail',()=>{
  const result=authFailureMessage({code:'over_email_send_rate_limit',status:429,message:'email rate limit exceeded'},'register')
  expect(result).toContain('limite de envios')
  expect(result).toContain('temporariamente indisponíveis')
 })
 it('orienta a confirmação pendente antes do login',()=>{
  expect(authFailureMessage({code:'email_not_confirmed',status:400},'login')).toContain('não foi confirmado')
 })
 it('distingue falha de credenciais de sessão expirada',()=>{
  expect(authFailureMessage({code:'invalid_credentials',status:400},'login')).toContain('senha incorretos')
  expect(authFailureMessage({code:'bad_jwt',status:403},'login')).toContain('sessão expirou')
 })
 it('explica limite de tentativas sem confundi-lo com e-mail',()=>{
  expect(authFailureMessage({code:'over_request_rate_limit',status:429},'register')).toContain('Muitas tentativas')
 })
 it('identifica e-mails não autorizados pelo serviço padrão',()=>{
  expect(authFailureMessage({code:'email_address_not_authorized',status:400},'register')).toContain('não está habilitado')
 })
 it('não revela mensagens brutas ou detalhes internos do servidor',()=>{
  expect(authFailureMessage(new Error('Internal: DB user=private debug token=secret'),'register')).not.toContain('secret')
  expect(authFailureMessage(null,'login')).toContain('Não foi possível entrar')
 })
})
