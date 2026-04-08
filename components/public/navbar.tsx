"use client"

import Link from 'next/link'
import { Menu, Globe, X, ChevronDown as ChevronDownIcon } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { UserMenu } from '@/components/private/user-menu'
import { Profile } from '@/types/general'
import { usePathname } from 'next/navigation'

const Navbar = ({ user, email }: { user?: Profile | null, email?: string }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  console.log(pathname)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setMobileOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-800">
      {pathname !== '/calculator' && (
        <div className='bg-neutral-700 flex items-center justify-center py-1.5 text-sm'>
          <p className='text-white'>Scopri dove stai perdendo denaro</p>
          <Link href="/calculator" className="ml-4 text-primary">
            Calcola ora
          </Link>
        </div>
      )}
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

            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='bg-transparent! text-white! hover:text-primary! px-0'>
                    <p className='group-data-[state=open]:text-primary!'>Soluzioni</p>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className='bg-neutral-800! border-neutral-700 rounded-2xl!'>
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

            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='bg-transparent! text-white! px-0'>
                    <p className='group-data-[state=open]:text-primary!'>Supporto</p>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className='bg-neutral-800! border-neutral-700 rounded-2xl!'>
                    <ul className='w-96 grid grid-cols-2'>
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
                <Button variant='outline' asChild className='text-white bg-transparent hover:text-white/90 hover:border-white/20 border-white/30 hover:bg-neutral-600/40!'>
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
          <Button variant="ghost" size="icon" className="text-white" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Fullscreen Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[calc(var(--navbar-height,72px))] z-40 bg-neutral-900 flex flex-col px-6 py-8 gap-6 overflow-y-auto">
          <nav className="flex flex-col gap-1 text-lg font-medium text-white">
            <MobileAccordion label="Soluzioni">
              <Link href="/solutions/gestione-sala" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Gestione Sala</div>
                <div className="text-xs text-neutral-400">Gestisci i tavoli con Smartables</div>
              </Link>
              <Link href="/solutions/gestione-prenotazioni" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Gestione Prenotazioni</div>
                <div className="text-xs text-neutral-400">Gestisci prenotazioni mancate con Smartables</div>
              </Link>
              <Link href="/solutions/crm" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">CRM</div>
                <div className="text-xs text-neutral-400">Gestisci più sedi con Smartables</div>
              </Link>
              <Link href="/solutions/analytics" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Analitiche</div>
                <div className="text-xs text-neutral-400">Scopri trend e pattern ricorrenti con Smartables</div>
              </Link>
              <Link href="/solutions/integrazione-ai" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Integrazione AI</div>
                <div className="text-xs text-neutral-400">Il tuo assistente AI fornito da Smartables</div>
              </Link>
              <Link href="/solutions/menu-digitale" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Menù digitale</div>
                <div className="text-xs text-neutral-400">Gestisci il tuo menu e i tuoi piatti con Smartables</div>
              </Link>
            </MobileAccordion>

            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-4 py-3 hover:bg-neutral-800 rounded-lg transition-colors">
              Prezzi
            </Link>

            <MobileAccordion label="Supporto">
              <Link href="/support" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Supporto</div>
                <div className="text-xs text-neutral-400">Ottieni supporto su domande e dubbi più frequenti</div>
              </Link>
              <Link href="/release-notes" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Note di rilascio</div>
                <div className="text-xs text-neutral-400">Analizza come è cambiato Smartables nel tempo</div>
              </Link>
              <Link href="/docs" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Documentazione</div>
                <div className="text-xs text-neutral-400">Esplora ed impara a fondo la documentazione di Smartables</div>
              </Link>
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 hover:bg-neutral-800 rounded-lg transition-colors">
                <div className="font-semibold text-sm">Articoli</div>
                <div className="text-xs text-neutral-400">Leggi gli articoli creati dal team di Smartables</div>
              </Link>
            </MobileAccordion>
          </nav>

          <div className="flex flex-col gap-4 mt-auto">
            <div className="h-px bg-neutral-700" />
            {user ? (
              <UserMenu user={user} email={email} context='shared' variant='sheet' />
            ) : (
              <div className='grid grid-cols-2 items-center gap-2'>
                <Button variant="outline" className="w-full font-semibold border-neutral-600 text-black hover:bg-neutral-800 hover:text-white" size="xl" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Accedi</Link>
                </Button>
                <Button className="w-full font-semibold bg-[#FF9710] hover:bg-[#FF971080] text-white border-[#FF9710]" size="xl" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Inizia</Link>
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 px-2 mt-4 text-neutral-400">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Italiano (IT)</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function MobileAccordion({ label, children }: { label: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800 rounded-lg transition-colors text-left"
      >
        <span>{label}</span>
        <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 ml-2 flex flex-col gap-0.5 border-l border-neutral-700 pl-3">
          {children}
        </div>
      )}
    </div>
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
      <NavigationMenuLink asChild className='rounded-lg! hover:bg-primary/5 focus:bg-neutral-700'>
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