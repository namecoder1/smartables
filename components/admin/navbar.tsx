import Image from "next/image"
import PageTitle from "../utility/page-title"
import { Button } from "../ui/button"
import { logout } from "@/utils/supabase/actions"
import { LogOut, Menu } from "lucide-react"
import Sidebar from '@/components/admin/sidebar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet"

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-4 py-3.5 lg:py-1">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className='lg:hidden'>
            <Menu size={20} className='text-white' />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-[#3B3B3B]! border-r-2! xl:hidden" showClose={false}>
            <SheetTitle className='hidden'>
              <div className='sm:hidden flex items-center gap-1.5'>
                <Image src='/logo.png' width={30} height={30} alt='logo' />
                <p className='text-2xl font-bold tracking-tighter text-white'>Smartables</p>
              </div>
            </SheetTitle>
            <Sidebar
              collapsible="none"
              className="bg-[#252525] border-none! w-full h-full"
            />
          </SheetContent>
        </Sheet>
        <div className='lg:hidden flex items-center gap-1.5'>
          <Image src='/logo.png' width={30} height={30} alt='logo' />
          <p className='text-2xl font-bold tracking-tighter text-white'>Smartables</p>
        </div>
        <PageTitle star={false} />
      </div>
      <Button onClick={logout} variant='destructive' size='sm'>
        <LogOut />
        Esci
      </Button>
    </nav>
  )
}

export default Navbar