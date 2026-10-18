import { createClient } from 'npm:@supabase/supabase-js@2.117.1'

// All operations are scoped to the authenticated bearer JWT. The admin key
// stays in the Edge Function environment, never in a browser or Git.
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}
})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}})
 if(req.method!=='POST')return json({error:'Método não permitido.'},405)
 const jwt=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')
 if(!jwt)return json({error:'Faça login para continuar.'},401)
 const url=Deno.env.get('SUPABASE_URL')
 const publicKey=Deno.env.get('SUPABASE_ANON_KEY')
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
 if(!url||!publicKey||!secret)return json({error:'Serviço indisponível. Tente novamente mais tarde.'},503)
 try{
  const body=await req.json() as {confirmation?:string;email?:string}
  if(body.confirmation!=='EXCLUIR')return json({error:'Confirmação inválida.'},400)
  const client=createClient(url,publicKey,{global:{headers:{Authorization:'Bearer '+jwt}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:authError}=await client.auth.getUser(jwt)
  if(authError||!user||!user.email)return json({error:'Sessão inválida.'},401)
  if(body.email?.trim().toLowerCase()!==user.email.toLowerCase())return json({error:'Confirme o e-mail da conta.'},400)
  // Require the user to re-authenticate with their password in the UI.
  const signedInAt=Date.parse(user.last_sign_in_at||'')
  if(!Number.isFinite(signedInAt)||Date.now()-signedInAt>5*60*1000||Date.now()<signedInAt-30000)return json({error:'Entre novamente na sua conta antes de excluí-la.'},403)
  const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
  // Clean up both private item photographs and public avatars before auth deletion.
  // This Edge Function must deploy only after the avatar-bucket migration.
  for(const bucket of ['coollects-items','coollects-avatars']){
   const files:string[]=[]
   for(let offset=0;offset<=10000;offset+=100){
    const {data,error}=await admin.storage.from(bucket).list(user.id,{limit:100,offset})
    if(error)throw error
    if(!data?.length)break
    for(const file of data){
     if(!file.name||!file.id)throw new Error('Unexpected storage entry')
     files.push(user.id+'/'+file.name)
    }
    if(data.length<100)break
    if(offset>=10000)throw new Error('Too many objects for single deletion')
   }
   for(let i=0;i<files.length;i+=100){
    const {error}=await admin.storage.from(bucket).remove(files.slice(i,i+100))
    if(error)throw error
   }
  }
  const {error:deleteError}=await admin.auth.admin.deleteUser(user.id)
  if(deleteError)throw deleteError
  return json({success:true})
 }catch{
  return json({error:'Não conseguimos concluir a exclusão agora. Sua conta pode permanecer ativa; entre em contato com o suporte se precisar de ajuda.'},500)
 }
})
