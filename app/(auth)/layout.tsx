import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const AuthLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <div className='w-full lg:grid lg:min-h-screen lg:grid-cols-2'>
      <div className='hidden bg-muted lg:block relative'>
        <Image
          src='/auth-bg.png'
          alt='Authentication background'
          fill
          className='h-full w-full object-cover grayscale-20 hover:grayscale-0 transition-all duration-500'
          priority
        />
        <div className='absolute top-6 right-6 z-20'>
          <Link href='/' className='underline text-white underline-offset-2 font-semibold'>
            Indietro
          </Link>
        </div>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-10 left-10 right-10 z-20 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;Smartables ha rivoluzionato il modo in cui gestiamo le nostre attività quotidiane. Un'esperienza utente senza pari.&rdquo;
            </p>
            <footer className="text-sm opacity-90">Sofia R., CEO</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-screen justify-center items-center py-12'>
        <div className='mx-auto grid w-87.5 gap-6'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout