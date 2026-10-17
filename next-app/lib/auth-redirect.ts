/** Accept only local application paths to prevent open redirects. */
export function safeAuthNext(value:string|null|undefined,fallback='/perfil'):string {
 if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||/[\u0000-\u001f\u007f]/.test(value))return fallback
 try {
  const parsed=new URL(value,'https://coollects.invalid')
  if(parsed.origin!=='https://coollects.invalid'||!parsed.pathname.startsWith('/'))return fallback
  if(parsed.pathname.startsWith('/auth/')||parsed.pathname==='/entrar'||parsed.pathname==='/registrar'||parsed.pathname==='/recuperar'||parsed.pathname==='/redefinir')return fallback
  return parsed.pathname+parsed.search+parsed.hash
 }catch{return fallback}
}
