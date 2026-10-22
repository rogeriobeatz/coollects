import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {createSupabaseServerClient} from '@/lib/supabase/server'
import {sendWebPush,type SavedSubscription} from '@/lib/push-server'
export const runtime='nodejs'
const fail=(status:number,reason:string)=>NextResponse.json({ok:false,reason},{status})
export async function POST(req:Request){
 if(!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)return fail(503,'server_not_configured')
 const db=await createSupabaseServerClient()
 const {data:{user},error:authError}=await db.auth.getUser()
 if(authError||!user)return fail(401,'not_authenticated')
 const input=await req.json().catch(()=>null)
 if(!input||!['follow','like','test'].includes(input.kind)|| (input.kind!=='test'&&(typeof input.targetId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.targetId))))return fail(400,'invalid_request')
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
 let recipient:string,actorId=user.id,eventKey:string,link:string,title:string,body:string
 if(input.kind==='test'){
  recipient=user.id
  eventKey='test:'+user.id+':'+Math.floor(Date.now()/60000)
  link='/notificacoes';title='Teste de notificação Coollects';body='Se você está vendo isto, o push está funcionando!'
 }else if(input.kind==='follow'){
  const {data}=await admin.from('user_follows').select('created_at').eq('follower_id',actorId).eq('followed_id',input.targetId).maybeSingle()
  if(!data||Date.now()-new Date(data.created_at).getTime()>120000)return fail(404,'event_not_found_or_expired')
  recipient=input.targetId
  eventKey='follow:'+actorId+':'+recipient+':'+data.created_at
  link='/notificacoes';title='Novo seguidor no Coollects';body='Alguém começou a seguir seu perfil.'
 }else{
  const {data}=await admin.from('item_likes').select('created_at,items!inner(owner_id)').eq('user_id',actorId).eq('item_id',input.targetId).maybeSingle()
  if(!data||Date.now()-new Date(data.created_at).getTime()>120000)return fail(404,'event_not_found_or_expired')
  const parent=data.items as unknown as {owner_id:string}
  recipient=parent.owner_id
  eventKey='like:'+actorId+':'+input.targetId+':'+data.created_at
  link='/item/'+encodeURIComponent(input.targetId);title='Seu item recebeu uma curtida!';body='Alguém curtiu uma peça da sua coleção.'
 }
 if(recipient===actorId&&input.kind!=='test')return NextResponse.json({ok:true,sent:0,reason:'self_action'})
 const {data:claim,error:claimError}=await admin.from('push_delivery_claims').insert({event_key:eventKey,actor_id:actorId,recipient_id:recipient}).select('event_key').single()
 if(claimError||!claim)return NextResponse.json({ok:false,sent:0,reason:claimError?.code==='23505'?'already_sent':'claim_failed'},{status:claimError?.code==='23505'?409:500})
 const {data:devices,error:deviceError}=await admin.from('push_subscriptions').select('endpoint,p256dh,auth,user_id').eq('user_id',recipient).limit(20)
 if(deviceError)return fail(500,'devices_lookup_failed')
 if(!devices?.length)return NextResponse.json({ok:false,sent:0,reason:'no_registered_devices'},{status:404})
 const results=await Promise.all((devices||[]).map(async(device)=>{
  const status=await sendWebPush(device as SavedSubscription,{title,body,url:link,tag:eventKey})
  if(status==='expired')await admin.from('push_subscriptions').delete().eq('user_id',recipient).eq('endpoint',device.endpoint)
  return status
 }))
 const sent=results.filter(r=>r==='sent').length
 return NextResponse.json({ok:sent>0,sent,failed:results.filter(r=>r==='error').length,expired:results.filter(r=>r==='expired').length,reason:sent?'accepted':'push_provider_rejected'},{status:sent?200:502})
}
