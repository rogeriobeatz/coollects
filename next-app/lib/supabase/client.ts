'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import { clearImageCache } from '../images'
let browserClient:SupabaseClient|null=null
export function getBrowserClient():SupabaseClient|null {
 const config=supabaseConfig()
 if(!config)return null
 if(!browserClient){
  browserClient=createBrowserClient(config.url,config.key)
  // Any sign-out (button, account deletion, expired session) wipes on-device photo copies.
  browserClient.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')void clearImageCache()})
 }
 return browserClient
}
