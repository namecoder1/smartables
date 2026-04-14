import { Suspense } from 'react'
import RegisterView from './register-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Crea il tuo account Smartables e inizia a gestire il tuo ristorante in modo intelligente.',
  robots: { index: false, follow: false },
}

const RegisterPage = () => {
  return (
    <Suspense fallback={null}>
      <RegisterView />
    </Suspense>
  )
}

export default RegisterPage