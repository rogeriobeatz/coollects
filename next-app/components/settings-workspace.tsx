'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {LogOut} from 'lucide-react'
import {AuthGate} from './auth-gate'
import {LegacyImport} from './legacy-import'
import {AccountDeletion} from './account-deletion'
import {getBrowserClient} from '@/lib/supabase/client'
export function SettingsWorkspace(){return <AuthGate>{id=><Settings userId={id}/>}</AuthGate>}
function Settings({userId}:{userId:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const router=useRouter()
 async function signOut(){
  const db=getBrowserClient();if(!db)return
  setBusy(true);const {error}=await db.auth.signOut();setBusy(false)
  if(error){setError('Não foi possível sair. Tente novamente.');return}
  router.replace('/');router.refresh()
 }
 return <section className="ux-settings">
  <h2>Conta</h2>
  <button type="button" className="ux-profile-row" disabled={busy} onClick={()=>void signOut()}><LogOut size={19}/> Sair da conta</button>
  {error&&<p className="scan-notice" role="alert">{error}</p>}
  <details className="ux-settings-import"><summary>Importar dados antigos</summary><LegacyImport userId={userId}/></details>
  <AccountDeletion/>
 </section>
}
