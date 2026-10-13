'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
let browserClient:SupabaseClient|null=null
export function getBrowserClient():SupabaseClient|null {
 const config=supabaseConfig()
 if(!config)return null
 if(!browserClient)browserClient=createBrowserClient(config.url,config.key)
 return browserClient
}
