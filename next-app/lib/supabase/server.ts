import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from './config'
export async function createSupabaseServerClient(){
 const config=supabaseConfig()
 if(!config)throw new Error('Supabase não configurado: veja next-app/.env.example')
 const store=await cookies()
 return createServerClient(config.url,config.key,{
  cookies:{
   getAll(){return store.getAll()},
   setAll(cookiesToSet){
    try{cookiesToSet.forEach(({name,value,options})=>store.set(name,value,options))}
    catch{/* Server Components não podem definir cookies; proxy.ts realiza o refresh. */}
   }
  }
 })
}
