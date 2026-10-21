'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import { clearImageCache } from '../images'
let browserClient:SupabaseClient|null=null
let lastSessionUserId:string|null=null
export function getBrowserClient():SupabaseClient|null {
 const config=supabaseConfig()
 if(!config)return null
 if(!browserClient){
  browserClient=createBrowserClient(config.url,config.key)
  // Clear private photo copies on logout AND when a different account signs in.
  // Do not await storage operations inside Supabase's auth callback.
  browserClient.auth.onAuthStateChange((event,session)=>{
   const nextUserId=session?.user?.id??null
   if(event==='SIGNED_OUT'){
    lastSessionUserId=null
    void clearImageCache()
   }else if(event==='SIGNED_IN'){
    if(lastSessionUserId&&nextUserId&&lastSessionUserId!==nextUserId)void clearImageCache()
    lastSessionUserId=nextUserId
   }else if(event==='INITIAL_SESSION')lastSessionUserId=nextUserId
  })
 }
 return browserClient
}
