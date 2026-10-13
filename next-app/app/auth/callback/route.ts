import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
export async function GET(request:Request){
 const url=new URL(request.url)
 const code=url.searchParams.get('code')
 const requested=url.searchParams.get('next')||'/perfil'
 const next=requested.startsWith('/')&&!requested.startsWith('//')&&!requested.includes('\\')&&new URL(requested,url.origin).origin===url.origin?requested:'/perfil'
 if(!code)return NextResponse.redirect(new URL('/entrar?erro=link',url.origin))
 try{
  const supabase=await createSupabaseServerClient()
  const {error}=await supabase.auth.exchangeCodeForSession(code)
  if(error)throw error
  return NextResponse.redirect(new URL(next,url.origin))
 }catch{return NextResponse.redirect(new URL('/entrar?erro=confirmacao',url.origin))}
}
