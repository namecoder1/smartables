"use client"

import Link from 'next/link'
import { Menu, Globe } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { UserMenu } from '@/components/private/user-menu'
import { Profile } from '@/types/general'

const Navbar = ({ user, email }: { user?: Profile | null, email?: string }) => {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-800">
      <div className="max-w-7xl mx-auto flex h-18 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="font-bold text-2xl tracking-tighter text-white">Smartables</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8 text-[15px] font-medium text-white">
            <Link href="/pricing" className="hover:text-[#FF9710] transition-colors">
              Prezzi
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='bg-transparent! text-white! hover:text-primary! px-0'>
                    <p className='group-data-[state=open]:text-primary!'>Soluzioni</p>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className='bg-neutral-800'>
                    <ul className='w-96 grid grid-cols-2'>
                      <ListItem href="/solutions/gestione-sala" title="Gestione Sala">
                        Gestisci i tavoli con Smartables
                      </ListItem>
                      <ListItem href="/solutions/gestione-prenotazioni" title="Gestione Prenotazioni">
                        Gestisci prenotazioni mancate con Smartables
                      </ListItem>
                      <ListItem href="/solutions/crm" title="CRM">
                        Gestisci più sedi con Smartables
                      </ListItem>
                      <ListItem href="/solutions/analytics" title="Analitiche">
                        Scopri trend e pattern ricorrenti con Smartables
                      </ListItem>
                      <ListItem href="/solutions/integrazione-ai" title="Integrazione AI">
                        Il tuo assistente AI fornuto da Smartables
                      </ListItem>
                      <ListItem href="/solutions/menu-digitale" title="Menù digitale">
                        Gestisci il tuo menu e i tuoi piatti con Smartables
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='bg-transparent! text-white! px-0'>
                    <p className='group-data-[state=open]:text-primary!'>Supporto</p>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent  className='bg-neutral-800'>
                    <ul className='w-96 grid grid-cols-2 '>
                      <ListItem href="/support" title="Supporto">
                        Ottieni supporto su domande e dubbi più frequenti
                      </ListItem>
                      <ListItem href="/release-notes" title="Note di rilascio">
                        Analizza come è cambiato Smartables nel tempo
                      </ListItem>
                      <ListItem href="/docs" title="Documentazione">
                        Esplora ed impara a fondo la documentazione di Smartables
                      </ListItem>
                      <ListItem href="/blog" title="Articoli">
                        Leggi gli articoli creati dal team di Smartables
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu user={user} email={email} context='shared' variant='navbar' />
            ) : (
              <>
                <Button variant='ghost' asChild className='text-white hover:text-white! hover:bg-neutral-600/40!'>
                  <Link href="/login">
                    Accedi
                  </Link>
                </Button>
                <Button className="bg-[#FF9710] font-semibold border-[#FF9710] text-white hover:bg-[#FF971080] hover:text-white" asChild>
                  <Link href="/register">
                    Inizia
                  </Link>
                </Button>
              </>
            )}
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
            <SheetContent side="right" className="w-75 sm:w-100">
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
                  {user ? (
                    <UserMenu user={user} email={email} context='shared' variant='sheet' />
                  ) : (
                    <>
                      <Button variant="outline" className="w-full justify-start font-semibold border-blue-600 text-blue-600" size="lg" asChild>
                        <Link href="/login">Accedi</Link>
                      </Button>
                      <Button className="w-full justify-start font-semibold bg-blue-600 hover:bg-blue-700 text-white" size="lg" asChild>
                        <Link href="/register">Inizia</Link>
                      </Button>
                    </>
                  )}
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

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild className='rounded-lg! hover:bg-neutral-700 focus:bg-neutral-700'>
        <Link href={href}>
          <div className="flex flex-col gap-1 text-sm">
            <div className="leading-none text-white font-bold text-md">{title}</div>
            <div className="line-clamp-2 text-white/70">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default Navbar