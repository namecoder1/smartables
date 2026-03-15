import React from 'react'
import NavbarSearch from './navbar-search'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/sheet'
import PrivateSidebar from './sidebar'
import { UserMenu } from './user-menu'
import PageTitle from './page-title'
import { createClient } from '@/utils/supabase/server'
import { Profile, Notification } from '@/types/general'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { TbHelpSquareRounded } from "react-icons/tb";
import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from './notification-bell'

const Navbar = async ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const { data: user } = await supabase.from("profiles").select("full_name, role, organization_id").eq("id", auth?.user?.id).single()

  // Fetch unread notifications + pending callbacks
  let notifications: Notification[] = []
  let pendingCallbacks = 0

  if (user?.organization_id) {
    const [notifResult, locationResult] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("organization_id", user.organization_id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("locations")
        .select("id")
        .eq("organization_id", user.organization_id)
        .limit(1)
        .maybeSingle(),
    ])

    notifications = (notifResult.data as Notification[]) || []

    if (locationResult.data) {
      const { count } = await supabase
        .from("callback_requests")
        .select("id", { count: "exact", head: true })
        .eq("location_id", locationResult.data.id)
        .eq("status", "pending")
      pendingCallbacks = count || 0
    }
  }

  return (
    <nav {...props} className={cn('flex items-center justify-between w-full px-5 xl:px-1 xl:pr-3 py-2 sm:py-0 xl:py-1.5 shrink-0', props.className)}>
      <div className='flex items-center gap-4 xl:gap-0'>
        <Sheet>
          <SheetTrigger className='xl:hidden'>
            <Menu size={20} className='text-white' />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-[#3B3B3B]! border-r-2! xl:hidden" showClose={false}>
            <SheetTitle className='hidden'>
              <div className='sm:hidden flex items-center gap-1.5'>
                <Image src='/logo.png' width={30} height={30} alt='logo' />
                <p className='text-2xl font-bold tracking-tighter text-white'>Smartables</p>
              </div>
            </SheetTitle>
            <PrivateSidebar
              collapsible="none"
              className="bg-[#252525] border-none! w-full h-full"
            />
          </SheetContent>
        </Sheet>
        <div className='xl:hidden flex items-center gap-1.5'>
          <Image src='/logo.png' width={30} height={30} alt='logo' />
          <p className='text-2xl font-bold tracking-tighter text-white'>Smartables</p>
        </div>
        <PageTitle />
      </div>
      <div className='flex items-center gap-2'>
        <NavbarSearch />
        <NotificationBell notifications={notifications} pendingCallbacks={pendingCallbacks} />
        <SupportDropdown />
        <UserMenu user={user as Profile} email={auth?.user?.email} />
      </div>
    </nav>
  )
}

const SupportDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='group p-1 bg-card/10 data-[state=open]:border-primary/60 border-2 rounded-lg hover:bg-primary/10 border-border/10 hover:border-primary/60'>
        <TbHelpSquareRounded size={26} className='text-white group-data-[state=open]:text-primary group-hover:text-primary/90' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' >
        <DropdownMenuItem>
          <Link href='/support'>Centro di supporto</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href='/docs'>Documentazione</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href='/release-notes'>Note di rilascio</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Navbar

