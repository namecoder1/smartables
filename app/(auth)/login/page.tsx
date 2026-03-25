import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginView from './login-view'

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Inserisci le tue credenziali per accedere all\'area protetta di Smartables con il tuo account.'
}

const LoginPage = () => {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  )
}

export default LoginPage