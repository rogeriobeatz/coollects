import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
export const metadata:Metadata={title:'Entrar'}
export default function SignInPage(){return <AccountForm mode="login"/>}
