import React from 'react'
import { SidebarTrigger } from '../ui/sidebar'
import { createClient } from '@/supabase/server'
import { Input } from '../ui/input'
import { Search, ShieldUser } from 'lucide-react'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import Link from 'next/link'
import { Separator } from '../ui/separator'

const Navbar = async () => {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const { data: user, error: userError } = await supabase.from("profiles").select("*").eq("id", auth?.user?.id).single()

  return (
    <nav className='flex sticky top-0 z-50 items-center bg-sidebar justify-between border-b w-full px-4'>
      <div className='flex items-center gap-2 md:gap-0'>
        <div className='border-r md:border-none border-neutral-600 pr-4 md:pr-0 py-4'>
          <SidebarTrigger size='icon-lg' className='md:hidden text-white hover:bg-neutral-600 p-2 hover:text-white' />
        </div>
        <div className='relative ml-2 md:ml-0 py-4'>
          <Input placeholder='Cerca' className='md:min-w-xs border border-neutral-700 text-white  ' />
          <Button variant='outline' className='rounded-l-none absolute right-0 top-1/2 -translate-y-1/2'>
            <Search size={16} />
          </Button>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='bg-[#FF9710] p-4 cursor-pointer shrink-0 size-10 flex items-center justify-center'>
            <p className='uppercase text-white'>{auth.user?.email?.split("@")[0]?.[0] || "U"}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='bottom' align='end'>
          <DropdownMenuLabel>
            <p>{auth.user?.email?.split("@")[0]}</p>
            <p className='capitalize flex items-center gap-1 text-muted-foreground'><ShieldUser size={16} />{user?.role}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button variant='outline' asChild className='w-full'>
              <Link href='/profile'>Profilo</Link>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

export default Navbar