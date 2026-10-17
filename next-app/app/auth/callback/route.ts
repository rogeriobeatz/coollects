import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { safeAuthNext } from '@/lib/auth-redirect'
export async function GET(request:Request){
 const url=new URL(request.url)
 const code=url.searchParams.get('code')
 // Password-recovery emails intentionally lead to the reset screen.
 const next=url.searchParams.get('next')==='/redefinir'?'/redefinir':safeAuthNext(url.searchParams.get('next'))
 if(!code)return NextResponse.redirect(new URL('/entrar?erro=link',url.origin))
 try{
  const supabase=await createSupabaseServerClient()
  const {error}=await supabase.auth.exchangeCodeForSession(code)
  if(error)throw error
  return NextResponse.redirect(new URL(next,url.origin))
 }catch{return NextResponse.redirect(new URL('/entrar?erro=confirmacao',url.origin))}
}
