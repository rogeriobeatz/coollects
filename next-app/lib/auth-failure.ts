type AuthFailure = {code?:string; status?:number; message?:string} | null | undefined

/** Friendly, actionable and non-sensitive messages for Supabase Auth errors. */
export function authFailureMessage(failure:unknown,mode:'login'|'register'):string{
 const error:AuthFailure=failure&&typeof failure==='object'?failure as AuthFailure:null
 const code=String(error?.code||'').toLowerCase()
 const status=error?.status
 const details=String(error?.message||'').toLowerCase()
 if(code==='over_email_send_rate_limit'||(status===429&&details.includes('email'))){
  return 'O serviço de confirmação por e-mail atingiu o limite de envios. Novos cadastros estão temporariamente indisponíveis. Tente novamente mais tarde.'
 }
 if(code==='email_address_not_authorized'||details.includes('email address not authorized')){
  return 'O serviço de confirmação ainda não está habilitado para este endereço de e-mail. Entre em contato com o suporte do Coollects.'
 }
 if(code==='over_request_rate_limit'||status===429){
  return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.'
 }
 if(code==='email_not_confirmed'){
  return 'Seu e-mail ainda não foi confirmado. Abra o link de confirmação recebido antes de entrar.'
 }
 if(code==='invalid_credentials'){
  return 'E-mail ou senha incorretos. Confira os dados ou recupere sua senha.'
 }
 if(code==='user_already_exists'||code==='email_exists'){
  return 'Este e-mail já está cadastrado. Entre na conta ou solicite uma nova senha.'
 }
 if(code==='weak_password'||details.includes('password should')||details.includes('password is too weak')){
  return 'Essa senha não atende aos requisitos de segurança. Escolha uma senha mais forte.'
 }
 if(code==='signup_disabled'||code==='email_provider_disabled'){
  return 'Novos cadastros estão temporariamente indisponíveis. Tente novamente mais tarde.'
 }
 if(code==='bad_jwt'||code==='refresh_token_not_found'){
  return 'Sua sessão expirou. Feche o aplicativo, abra novamente e entre na sua conta.'
 }
 if(details.includes('failed to fetch')||details.includes('network')||details.includes('fetch failed')){
  return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
 }
 return mode==='register'
  ?'Não foi possível concluir o cadastro agora. Tente novamente mais tarde.'
  :'Não foi possível entrar. Confira seus dados e tente novamente.'
}
