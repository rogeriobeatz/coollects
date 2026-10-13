'use client'
import { useEffect,useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
export function useAccount(){
 const [user,setUser]=useState<User|null>(null)
 const [loading,setLoading]=useState(true)
 const [configured,setConfigured]=useState(true)
 useEffect(()=>{
  const supabase=getBrowserClient()
  if(!supabase){setConfigured(false);setLoading(false);return}
  let active=true
  supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setLoading(false)}}).catch(()=>{if(active)setLoading(false)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active){setUser(session?.user??null);setLoading(false)}})
  return ()=>{active=false;subscription.unsubscribe()}
 },[])
 return {user,loading,configured}
}
