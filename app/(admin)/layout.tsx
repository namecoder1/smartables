import Navbar from '@/components/admin/navbar'
import Sidebar from '@/components/admin/sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed inset-0 h-full w-full">
      <SidebarProvider className="h-full w-full min-h-0" defaultOpen={true}>
        <div className="flex h-full w-full lg:p-4  bg-[#fcfaee] dark:bg-[#0a0a0a]">
          <Sidebar
            collapsible='none'
            className="hidden lg:flex bg-transparent border-none"
          />

          <div className="flex flex-1 flex-col h-full overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto bg-background border border-border lg:m-2 h-full">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default AdminLayout