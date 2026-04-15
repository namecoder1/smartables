"use client"

import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { ShieldUser } from 'lucide-react'
import { LuCircleUserRound } from "react-icons/lu";
import Link from 'next/link'
import { Profile } from '@/types/general'
import { logout } from '@/utils/supabase/actions'
import { getRoleLabel } from '@/lib/utils'

export const UserMenu = ({ 
  user, 
  email,
  context = 'default',
  variant = 'navbar'
}: { 
  user: Profile | null, 
  email: string | undefined,
  context: 'default' | 'shared',
  variant: 'navbar' | 'sheet'
}) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {setMounted(true)}, [])

  if (!mounted) {
    return (
      <div className='bg-[#FF9710] p-4 shrink-0 size-10 flex items-center justify-center opacity-0 rounded-lg'>
      </div>
    )
  }

  if (context === 'shared') {
    return (
      <>
        <Button asChild variant='outline' size='icon-lg' className='border-2 hidden md:flex text-black border-neutral-300/10!'>
          <Link href='/home'>
            <LuCircleUserRound size={26} color='black' />
          </Link>
        </Button>
        <Button asChild variant='outline' size='icon-lg' className='border-2 w-full md:hidden text-black border-neutral-300/10!'>
          <Link href='/home'>
            <LuCircleUserRound size={26} color='black' />
            <span className='md:hidden'>Profilo</span>
          </Link>
        </Button>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='group p-1 bg-card/10! data-[state=open]:border-primary/60 border-2 rounded-lg hover:bg-primary/10 border-border/10 hover:border-primary/60'>
          <LuCircleUserRound size={26} className='text-white group-data-[state=open]:text-primary group-hover:text-primary/90' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='bottom' align='end' className='w-52'>
        <DropdownMenuLabel className='flex flex-col gap-2'>
          <p className='flex flex-col'>
            <span className='text-foreground font-semibold'>Loggato come:</span>
            <span className='text-sm text-muted-foreground'>{email}</span>
          </p>
          <span className='capitalize flex items-center gap-0.5 text-muted-foreground'><ShieldUser size={16} />{getRoleLabel(user?.role!)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant='ghost' asChild className='w-full justify-start mb-0.5'>
            <Link href='/profile' className='cursor-pointer'>Il tuo Profilo</Link>
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button variant='ghost' asChild className='w-full justify-start'>
            <Link href='/billing' className='cursor-pointer'>Gestisci Fatturazione</Link>
          </Button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant='destructive' onClick={logout} className='w-full justify-start hover:bg-destructive/90! hover:text-white!'>
            Logout
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
