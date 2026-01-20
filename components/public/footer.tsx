import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className='bg-black text-white'>
      <div className='w-full max-w-7xl mx-auto px-4'>
        <div className='flex flex-col md:flex-row justify-between w-full items-start gap-y-8 py-12 px-6'>
          <div className='flex items-center gap-3'>
            <Image src="/logo.png" alt="Logo" width={55} height={55} />
            <div className='flex flex-col'>
              <span className='text-2xl font-bold'>Smartables</span>
              <p className='text-gray-400 text-sm'>Il sistema operativo per il tuo ristorante</p>
            </div>
          </div>
          <div className='grid grid-cols-3 max-w-xl gap-12'>
            <div className='flex flex-col gap-2'>
              <h4 className='font-bold text-lg mb-1'>Smartables</h4>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Home</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Soluzioni</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Prezzi</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Supporto</Link>
            </div>
            <div className='flex flex-col gap-2'>
              <h4 className='font-bold text-lg mb-1'>Soluzioni</h4>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Gestione Sala</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>CRM</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Gestione prenotazioni</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Integrazione AI</Link>
            </div>
            <div className='flex flex-col gap-2'>
              <h4 className='font-bold text-lg mb-1'>Legale</h4>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Politica sulla privacy</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Termini e Condizioni</Link>
              <Link href='/' className='hover:text-[#FF9710] transition-colors text-sm'>Contattaci</Link>
            </div>
          </div>
        </div>
        <div className='text-center py-6 border-t border-neutral-800'>
          &copy; Smartables {new Date().getFullYear()} - P.IVA 02863390411
        </div>
      </div>
    </footer>
  )
}

export default Footer