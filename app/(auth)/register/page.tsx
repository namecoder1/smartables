import RegisterView from './register-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Seleziona il tuo piano e registrati a Smartables'
}

const RegisterPage = () => {
  return (
    <RegisterView />
  )
}

export default RegisterPage