import { Metadata } from 'next'
import LoginView from './login-view'

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Inserisci le tue credenziali per accedere all\'area protetta di Smartables con il tuo account.'
}

const LoginPage = () => {
  return (
    <LoginView />
  )
}

export default LoginPage