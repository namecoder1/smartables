"use client"

import { Input } from '../ui/input'
import { useState, useEffect } from 'react'
import SearchFloating from '../utility/search-floating'
import { CommandGroup, CommandItem } from '../ui/command'
import { useRouter } from 'next/navigation'
import { routes, isRouteGroup, RouteEntry } from '@/lib/routes'
import { Kbd } from '../ui/kbd'

const NavbarSearch = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const renderRouteEntry = (entry: RouteEntry, index: number) => {
    if (isRouteGroup(entry)) {
      // È un gruppo con sottomenu
      return entry.items.map((item) => (
        <CommandItem key={item.url} onSelect={() => runCommand(() => router.push(item.url))}>
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.title}</span>
        </CommandItem>
      ))
    } else {
      // È un link singolo
      return (
        <CommandItem key={entry.url} onSelect={() => runCommand(() => router.push(entry.url))}>
          <entry.icon className="mr-2 h-4 w-4" />
          <span>{entry.label}</span>
        </CommandItem>
      )
    }
  }

  return (
    <>
      <div className='relative py-4 hidden sm:block' onClick={() => setOpen(true)}>
        <Input
          placeholder='Cerca...'
          className='max-w-40 w-full border-2 border-border/10 dark:border-border bg-card/10 placeholder:text-white dark:bg-card! cursor-pointer'
          readOnly
        />
        <div className='flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2'>
          <Kbd className='bg-white/10 text-white border border-white/20'>Ctrl</Kbd>
          +
          <Kbd className='bg-white/10 text-white border border-white/20'>K</Kbd>
        </div>
      </div>

      <SearchFloating open={open} onOpenChange={setOpen} placeholder="Cerca una pagina...">
        <CommandGroup heading="Gestione sede">
          {routes.platform.map((entry, index) => renderRouteEntry(entry, index))}
        </CommandGroup>
        <CommandGroup heading="Gestione organizzazione">
          {routes.organization.map((entry, index) => renderRouteEntry(entry, index))}
        </CommandGroup>
      </SearchFloating>
    </>
  )
}

export default NavbarSearch
