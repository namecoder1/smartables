import React from 'react'
import NavbarSearch from './navbar-search'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/sheet'
import PrivateSidebar from './sidebar'
import { UserMenu } from './user-menu'
import { createClient } from '@/supabase/server'
import { Profile } from '@/types/general'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { TbHelpSquareRounded } from "react-icons/tb";
import Link from 'next/link'
import Image from 'next/image'

const Navbar = async (props: React.HTMLAttributes<HTMLDivElement>) => {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const { data: user } = await supabase.from("profiles").select("full_name, role").eq("id", auth?.user?.id).single()


  return (
    <nav {...props} className={cn('flex  items-center justify-between w-full px-4 shrink-0', props.className)}>
      <div className='flex items-center gap-4 md:gap-0'>
        <Sheet>
          <SheetTrigger className='lg:hidden'>
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent side="left" className="w-64" showClose={false}>
            <SheetTitle className='hidden'>
              <div className='sm:hidden flex items-center gap-1.5'>
                <Image src='/logo.png' width={30} height={30} alt='logo' />
                <p className='text-2xl font-bold tracking-tighter'>Smartables</p>
              </div>
            </SheetTitle>
            <PrivateSidebar collapsible="none" className="bg-transparent border-none w-full h-full" />
          </SheetContent>
        </Sheet>
        <div className='sm:hidden flex items-center gap-1.5'>
          <Image src='/logo.png' width={30} height={30} alt='logo' />
          <p className='text-2xl font-bold tracking-tighter'>Smartables</p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <NavbarSearch />
        <SupportDropdown />
        <UserMenu user={user as Profile} email={auth?.user?.email} />
      </div>
    </nav>
  )
}

const SupportDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='p-1 bg-background dark:bg-input border dark:hover:bg-neutral-700/50 hover:bg-[#eaeaea]'>
        <TbHelpSquareRounded size={26} className='text-[#808080] dark:text-white' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' >
        <DropdownMenuItem>
          <Link href='/support'>Centro supporto</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href='/support'>Documentazione</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href='/support'>Release Notes</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Navbar
