import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/lib/supabase/config'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(){
 const config=supabaseConfig()
 if(!config)
  return NextResponse.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})
 try{
  const db=createClient(config.url,config.key,{auth:{autoRefreshToken:false,persistSession:false}})
  const {error}=await db.from('collections').select('id',{head:true,count:'exact'}).eq('is_public',true)
  if(error)throw error
  return NextResponse.json({status:'ok'},{headers:{'Cache-Control':'no-store'}})
 }catch{
  return NextResponse.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})
 }
}
