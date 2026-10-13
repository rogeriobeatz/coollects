import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
export const metadata:Metadata={title:'Criar conta'}
export default function SignUpPage(){return <AccountForm mode="register"/>}
