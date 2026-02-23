import React from 'react'
import NavbarSearch from './navbar-search'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/sheet'
import PrivateSidebar from './sidebar'
import { UserMenu } from './user-menu'
import PageTitle from './page-title'
import { createClient } from '@/utils/supabase/server'
import { Profile } from '@/types/general'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { TbHelpSquareRounded } from "react-icons/tb";
import Link from 'next/link'
import Image from 'next/image'

interface NavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  organizationId?: string
  activationStatus?: string
  managedAccountId?: string | null
  starredPages?: { id: string; url: string; title: string }[]
  complianceStatus?: string
}

const Navbar = async ({ organizationId, activationStatus, managedAccountId, starredPages, complianceStatus, ...props }: NavbarProps) => {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const { data: user } = await supabase.from("profiles").select("full_name, role").eq("id", auth?.user?.id).single()


  return (
    <nav {...props} className={cn('flex items-center justify-between w-full px-5 xl:px-1 xl:pr-3 py-2 sm:py-0 xl:py-1.5 shrink-0', props.className)}>
      <div className='flex items-center gap-4 xl:gap-0'>
        <Sheet>
          <SheetTrigger className='xl:hidden'>
            <Menu size={20} className='text-white dark:text-foreground' />
          </SheetTrigger>
          <SheetContent side="left" className="w-64" showClose={false}>
            <SheetTitle className='hidden'>
              <div className='sm:hidden flex items-center gap-1.5'>
                <Image src='/logo.png' width={30} height={30} alt='logo' />
                <p className='text-2xl font-bold tracking-tighter text-white dark:text-foreground'>Smartables</p>
              </div>
            </SheetTitle>
            <PrivateSidebar
              collapsible="none"
              className="bg-[#252525] dark:bg-[#262626] border-none! w-full h-full"
              organizationId={organizationId}
              activationStatus={activationStatus}
              managedAccountId={managedAccountId}
              starredPages={starredPages}
              complianceStatus={complianceStatus}
            />
          </SheetContent>
        </Sheet>
        <div className='xl:hidden flex items-center gap-1.5'>
          <Image src='/logo.png' width={30} height={30} alt='logo' />
          <p className='text-2xl font-bold tracking-tighter text-white dark:text-foreground'>Smartables</p>
        </div>
        <PageTitle starredPages={starredPages} />
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
      <DropdownMenuTrigger className='group p-1 bg-card/10 dark:bg-card data-[state=open]:border-primary/60 border-2 rounded-lg dark:hover:bg-primary/10 border-border/10 dark:border-border hover:bg-primary/10 hover:border-primary/60'>
        <TbHelpSquareRounded size={26} className='text-white group-data-[state=open]:text-primary group-hover:text-primary/90' />
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
