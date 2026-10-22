import {NextResponse} from 'next/server'
import {createSupabaseServerClient} from '@/lib/supabase/server'
import {validSubscription} from '@/lib/push-server'
export const runtime='nodejs'
export async function POST(req:Request){
 const db=await createSupabaseServerClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'auth_required'},{status:401})
 const value=await req.json().catch(()=>null)
 if(!validSubscription(value))return NextResponse.json({error:'invalid_subscription'},{status:400})
 const {error}=await db.from('push_subscriptions').upsert({user_id:user.id,endpoint:value.endpoint,p256dh:value.keys.p256dh,auth:value.keys.auth,updated_at:new Date().toISOString()},{onConflict:'endpoint'})
 if(error)return NextResponse.json({error:'subscription_failed'},{status:400})
 return NextResponse.json({ok:true})
}
export async function DELETE(req:Request){
 const db=await createSupabaseServerClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'auth_required'},{status:401})
 const value=await req.json().catch(()=>null)
 if(typeof value?.endpoint!=='string')return NextResponse.json({error:'invalid_endpoint'},{status:400})
 const {error}=await db.from('push_subscriptions').delete().eq('user_id',user.id).eq('endpoint',value.endpoint)
 return NextResponse.json({ok:!error},{status:error?400:200})
}
