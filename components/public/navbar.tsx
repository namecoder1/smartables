"use client"

import Link from 'next/link'
import { Menu, Globe } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

const Navbar = () => {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="font-bold text-2xl tracking-tight text-white">Smartables</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8 text-[15px] font-medium text-white">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <p className='cursor-pointer'>Soluzioni</p>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-140 mt-2 p-2 bg-neutral-950 border border-neutral-800 rounded-md shadow-lg grid grid-cols-2'>
                <DropdownMenuItem className='hover:text-[#FF9710]! flex flex-col items-start justify-center px-6 py-4 text-white transition-colors hover:bg-white/5! rounded-sm border border-neutral-800'>
                  <Link href="/solutions/gestione-sala" className='font-bold text-lg'>Gestione Sala</Link>
                  <p className='text-sm'>Gestisci i tavoli con Smartables</p>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:text-[#FF9710]! flex flex-col items-start justify-center px-6 py-4 text-white transition-colors hover:bg-white/5! rounded-sm border border-neutral-800'>
                  <Link href="/solutions/crm" className='font-bold text-lg'>CRM</Link>
                  <p className='text-sm'>Gestisci più sedi con Smartables</p>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:text-[#FF9710]! flex flex-col items-start justify-center px-6 py-4 text-white transition-colors hover:bg-white/5! rounded-sm border border-neutral-800'>
                  <Link href="/solutions/gestione-prenotazioni" className='font-bold text-lg'>Gestione prenotazioni</Link>
                  <p className='text-sm'>Gestisci prenotazioni mancate con Smartables</p>
                </DropdownMenuItem>
                <DropdownMenuItem className='hover:text-[#FF9710]! flex flex-col items-start justify-center px-6 py-4 text-white transition-colors hover:bg-white/5! rounded-sm border border-neutral-800'>
                  <Link href="/solutions/integrazione-ai" className='font-bold text-lg'>Integrazione AI</Link>
                  <p className='text-sm'>Il tuo assistente AI fornito da Smartables</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/pricing" className="hover:text-[#FF9710] transition-colors">
              Prezzi
            </Link>
            <Link href="/support" className="hover:text-[#FF9710] transition-colors">
              Supporto
            </Link>
          </nav>

          {/* Functional Divider */}
          <div className="h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-4">
            <div className="flex items-center text-white hover:text-[#FF9710] cursor-pointer">
              <Globe className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">IT</span>
            </div>
            {/* <Button className="rounded-2xl bg-[#FF9710] font-semibold border-[#FF9710] text-white hover:bg-[#FF971080] hover:text-white" asChild>
              <Link href="/login">
                Accedi
              </Link>
            </Button> */}
          </div>
        </div>


        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="border-b pb-6 mb-6">
                <SheetTitle className="text-left text-2xl font-bold">Smartables</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                <nav className="flex flex-col gap-2 text-lg font-medium text-gray-700">
                  <Link href="/solutions" className="block px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                    Soluzioni
                  </Link>
                  <Link href="/pricing" className="block px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                    Prezzi
                  </Link>
                  <Link href="/support" className="block px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                    Supporto
                  </Link>
                </nav>

                <div className="mt-auto flex flex-col gap-4">
                  <div className="h-px bg-gray-100 my-2" />
                  <Button variant="outline" className="w-full justify-start font-semibold border-blue-600 text-blue-600" size="lg">
                    Accedi
                  </Button>
                  <Button className="w-full justify-start font-semibold bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    Richiedi demo
                  </Button>
                  <div className="flex items-center gap-2 px-2 mt-4 text-gray-500">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Italiano (IT)</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar