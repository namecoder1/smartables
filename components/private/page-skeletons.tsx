import { Skeleton } from '@/components/ui/skeleton'
import PageWrapper from '@/components/private/page-wrapper'
import { Separator } from '../ui/separator';

// Components
function SCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 p-6 ${className ?? ''}`}>
      {children}
    </div>
  )
}

function ContainerCard({ children, className, childClass } : { children: React.ReactNode; className?: string, childClass?: string}) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 ${className ?? ''}`}>
      <div className='border-b-2 border-gray-100 py-5 px-6'>
        <Skeleton className='h-5 w-32' />
      </div>
      <div className={`p-6 ${childClass}`}>
        {children}
      </div>
    </div>
  )
}

function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonChart({ height = 'h-48' }: { height?: string }) {
  return <Skeleton className={`w-full ${height} rounded-lg`} />
}

function SkeletonOverviewCards({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-6 md:gap-0`}>
      {Array.from({ length: count }).map((_, i) => (
        <SCard key={i} className='flex items-center justify-between py-6 md:first:rounded-r-none md:not-first:rounded-none md:last:rounded-r-3xl'>
          <div>
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-14 w-14 mb-2 hidden md:flex" />
        </SCard>
      ))}
    </div>
  )
}

// Home
export function HomeSkeleton() {
  return (
    <PageWrapper>
      {/* Welcome */}
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SCard key={i}>
            <Skeleton className="h-3.5 w-20 mb-3" />
            <Skeleton className="h-8 w-14 mb-2" />
            <Skeleton className="h-12 w-full" />
          </SCard>
        ))}
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 items-start'>
        <div className="grid lg:grid-cols-2 items-center gap-6 2xl:col-span-2">
          <ContainerCard>
            <SkeletonChart height="h-56" />
          </ContainerCard>
          <ContainerCard>
            <SkeletonChart height="h-56" />
          </ContainerCard>
          <ContainerCard>
            <SkeletonChart height="h-44" />
          </ContainerCard>
          <ContainerCard>
            <SkeletonChart height="h-44" />
          </ContainerCard>          
        </div>
        <div className='gap-6 flex flex-col'>
          <ContainerCard className='w-full'>
            <SkeletonChart height="h-44" />
          </ContainerCard>
          <ContainerCard className='w-full'>
            <SkeletonChart height="h-44" />
          </ContainerCard>
        </div>
      </div>
      {/* Charts */}
    </PageWrapper>
  )
}

// Dashboard
export function DashboardSkeleton() {
  return (
    <PageWrapper>
      <div className='flex items-center justify-between'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      {/* KPI cards */}
      <div className='grid lg:grid-cols-3 gap-6'>
        <div className="grid grid-cols-2 gap-6 lg:col-span-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SCard key={i}>
              <Skeleton className="h-3.5 w-20 mb-3" />
              <Skeleton className="h-8 w-14 mb-2" />
              <Skeleton className="h-12 w-full" />
            </SCard>
          ))}
        </div>
        <SCard>
          <Skeleton className="h-5 w-28 mb-3" />
          <SkeletonChart height="h-72" />
        </SCard>
      </div>
      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ContainerCard>
          <SkeletonChart height="h-52" />
        </ContainerCard>
        <ContainerCard>
          <SkeletonChart height="h-52" />
        </ContainerCard>
      </div>
      {/* Charts row 2 + table */}
      <ContainerCard>
        <SkeletonChart height="h-52" />
      </ContainerCard>
    </PageWrapper>
  )
}

// Reservations
export function AreaManagementSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <ContainerCard className='h-full'>
        <div className='grid-cols-1 xl:grid-cols-4 grid gap-6'>
          <div className='hidden xl:block'>
            <Skeleton className='h-10' />
          </div>
          <Skeleton className='xl:col-span-3 h-160' />
        </div>
      </ContainerCard>
    </PageWrapper>
  )
}

export function ReservationsManagementSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className='h-8 w-20' />
      </div>
      <SkeletonOverviewCards count={3} />
      {/* Filters row */}
      <div className="flex gap-3 items-center">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24 ml-auto" />
      </div>
      {/* Table */}
      <SCard>
        {/* Header */}
        <div className="flex gap-4 items-center pb-3 border-b border-gray-100 mb-3">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 flex-1" />
          ))}
        </div>
        <SkeletonTableRows rows={8} cols={5} />
      </SCard>
    </PageWrapper>
  )
}

export function ReservationsCalendarSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className='h-8 w-20' />
      </div>
      <ContainerCard className='h-full'>
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-30 w-full rounded-lg" />
          ))}
        </div>
      </ContainerCard>
    </PageWrapper>
  )
}

// Menus
export function MenusManagementSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      {/* Overview cards */}
      <SkeletonOverviewCards count={3} />
      <Separator />
      {/* Menu cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SCard key={i} className='p-6'>
            <div className="flex justify-between items-start mb-3 pb-4">
              <div className='space-y-1'>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-46" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-32 mb-1.5" />
            <Skeleton className="h-3.5 w-32 mb-4" />
            <div className='flex items-center justify-between pt-4'>
              <Skeleton className="h-8 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </SCard>
        ))}
      </div>
    </PageWrapper>
  )
}

export function MenuEditorSkeleton() {
  return (
    <PageWrapper>
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16 rounded-full ml-2" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Categories sidebar */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SCard key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </SCard>
          ))}
        </div>
        {/* Items panel */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <SCard key={i} className="flex gap-4 items-center">
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3.5 w-full mb-1" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
              <Skeleton className="h-5 w-14 shrink-0" />
            </SCard>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}

// Clients
export function ClientsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SCard key={i}>
            <Skeleton className="h-3.5 w-20 mb-3" />
            <Skeleton className="h-8 w-14 mb-2" />
            <Skeleton className="h-12 w-full" />
          </SCard>
        ))}
      </div>
      {/* Table */}
      <ContainerCard>
        <SkeletonTableRows rows={8} cols={5} />
      </ContainerCard>
    </PageWrapper>
  )
}

export function ClientDetailSkeleton() {
  return (
    <PageWrapper>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sidebar */}
        <SCard className="flex flex-col items-center gap-4 py-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-28" />
          <div className="w-full border-t border-gray-100 pt-4 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </SCard>
        {/* Main */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SCard key={i}>
                <Skeleton className="h-3.5 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-12 w-full" />
              </SCard>
            ))}
          </div>
          <SCard>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <Skeleton className="h-3.5 w-16 mb-1.5" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </SCard>
          <SCard>
            <Skeleton className="h-5 w-36 mb-4" />
            <SkeletonTableRows rows={4} cols={4} />
          </SCard>
        </div>
      </div>
    </PageWrapper>
  )
}

// Orders
export function OrdersSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      {/* Overview cards */}
      <SkeletonOverviewCards count={3} />
      {/* Kanban columns */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            {Array.from({ length: col === 0 ? 4 : col === 1 ? 2 : 1 }).map((_, i) => (
              <SCard key={i}>
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-3.5 w-full mb-1.5" />
                ))}
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                </div>
              </SCard>
            ))}
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}

// Inbox
export function InboxSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className='h-8 w-20' />
      </div>
      <div className="flex flex-col md:flex-row h-full min-h-180 gap-6">
        {/* Conversation list */}
        <ContainerCard className="md:w-60 rounded-3xl border-gray-200 bg-white flex flex-col gap-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex p-2 gap-3 border-b border-gray-50">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1.5" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
          ))}
        </ContainerCard>
        {/* Chat area */}
        <ContainerCard className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 p-6 flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className={`h-12 rounded-xl ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
              </div>
            ))}
          </div>
        </ContainerCard>
      </div>
    </PageWrapper>
  )
}

// Analytics
export function AnalyticsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>
      {/* KPI cards (4) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SCard key={i}>
            <Skeleton className="h-3.5 w-24 mb-4" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-20 mt-2" />
          </SCard>
        ))}
      </div>
      {/* Period comparison cards (3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SCard key={i}>
            <Skeleton className="h-3.5 w-28 mb-2" />
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </SCard>
        ))}
      </div>
      {/* Charts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ContainerCard>
          <SkeletonChart height="h-48" />
        </ContainerCard>
        <ContainerCard className='lg:col-span-2'>
          <SkeletonChart height="h-48" />
        </ContainerCard>
      </div>
      <ContainerCard className='lg:col-span-2'>
        <SkeletonChart height="h-32" />
      </ContainerCard>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <ContainerCard key={i}>
            <SkeletonChart height="h-40" />
          </ContainerCard>
        ))}
      </div>
      <ContainerCard className='lg:col-span-2'>
        <SkeletonChart height="h-32" />
      </ContainerCard>
      <ContainerCard className='lg:col-span-2'>
        <SkeletonChart height="h-32" />
      </ContainerCard>
      <ContainerCard className='lg:col-span-2'>
        <SkeletonChart height="h-32" />
      </ContainerCard>
    </PageWrapper>
  )
}

// Site management
export function AreasManagementSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>
      {/* Overview cards */}
      <SkeletonOverviewCards count={3} />
      {/* Floor plan cards */}
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SCard key={i}>
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-4 w-20" />
            <div className="flex justify-end mt-3 ml-auto">
              <Skeleton className="h-8 w-8 rounded-r-none" />
              <Skeleton className="h-8 w-8 rounded-none" />
              <Skeleton className="h-8 w-8 rounded-l-none" />
            </div>
          </SCard>
        ))}
      </div>
    </PageWrapper>
  )
}

export function SiteSettingsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className='grid grid-cols-3 gap-6'>
        <ContainerCard className='col-span-2'>
          <Skeleton className="h-12 max-w-120 w-full mb-5" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
          <Separator className='my-6' />
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <div>
                <Skeleton className='h-6 w-32 mb-2' />
                <Skeleton className='h-4 w-52' />
                <div className="grid grid-cols-1 gap-4 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className='mt-6'>
                <Skeleton className='h-4 w-32 mb-2' />
                <Skeleton className='h-40 w-full' />
              </div>
            </div>
            <div>
              <Skeleton className='h-6 w-32 mb-2' />
              <Skeleton className='h-4 w-52' />
              <div className="grid grid-cols-1 gap-4 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ContainerCard>
        <div className='flex flex-col gap-6'>
          <ContainerCard>
            <div className="flex-1 grid grid-cols-1 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-1.5 border-b last:border-b-0 pb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </ContainerCard>
          <SCard className='flex flex-col items-center justify-center pt-8'>
            <Skeleton className="h-12 w-12 mb-5" />
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-3.5 w-60 mb-3.5" />
            <Skeleton className="h-8 w-20" />
          </SCard>
        </div>
      </div>
    </PageWrapper>
  )
}

export function ConnectionsSkeleton() {
  return (
    <PageWrapper>
      <Skeleton className='h-10 w-40' />
    </PageWrapper>
  )
}

export function TemplateWizardSkeleton() {
  const TypeCardSkeleton = () => (
    <div className="flex flex-col border-2 bg-card rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );

  return (
    <PageWrapper>
      <div className="space-y-1">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-3 w-14 mb-3" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => <TypeCardSkeleton key={i} />)}
          </div>
        </div>
        <div>
          <Skeleton className="h-3 w-20 mb-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => <TypeCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export function TemplatesSkeleton() {
  return (
    <PageWrapper>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-24 rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </PageWrapper>
  )
}

export function TemplateEditSkeleton() {
  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div>
            <Skeleton className="h-8 w-52 mb-1.5" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Nome e descrizione */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-40 mb-1.5" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-3 w-72" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            </div>
          </SCard>

          {/* Card 2: Tipo di sconto */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-3.5 w-80" />
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </SCard>

          {/* Card 3: Dove si applica */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-36 mb-1.5" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            </div>
          </SCard>

          {/* Card 4: Cosa viene scontato */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-40 mb-1.5" />
              <Skeleton className="h-3.5 w-80" />
            </div>
            <div className="p-6">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </SCard>
        </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Card: Stato */}
        <SCard className="p-0!">
          <div className="p-6 pb-4 border-b-2 border-gray-100">
            <Skeleton className="h-5 w-16 mb-1.5" />
            <Skeleton className="h-3.5 w-52" />
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </SCard>

        {/* Card: Periodo di validità */}
        <SCard className="p-0!">
          <div className="p-6 pb-4 border-b-2 border-gray-100">
            <Skeleton className="h-5 w-36 mb-1.5" />
            <Skeleton className="h-3.5 w-52" />
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </div>
        </SCard>

        {/* Card: Fedeltà cliente */}
        <SCard className="p-0!">
          <div className="p-6 pb-4 border-b-2 border-gray-100">
            <Skeleton className="h-5 w-32 mb-1.5" />
            <Skeleton className="h-3.5 w-52" />
          </div>
          <div className="p-6 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-9 w-full" />
          </div>
        </SCard>

        {/* Card: Notifiche */}
        <SCard className="p-0!">
          <div className="p-6 pb-4 border-b-2 border-gray-100">
            <Skeleton className="h-5 w-24 mb-1.5" />
            <Skeleton className="h-3.5 w-44" />
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full shrink-0" />
          </div>
        </SCard>
      </div>
    </div>
    </PageWrapper>
  )
}

export function ComplianceSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className='md:grid grid-cols-1 md:grid-cols-3 gap-6 space-y-6'>
        <div className='col-span-2 flex flex-col gap-6'>
          <SCard className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </SCard>
          {/* Business info */}
          <ContainerCard>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </ContainerCard>
        </div>
        <div className='flex flex-col gap-6'>
          <ContainerCard>
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-1.5 border-b last:border-b-0 pb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </ContainerCard>
          <ContainerCard>
            <div className="flex-1 grid grid-cols-1 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-1.5 border-b last:border-b-0 pb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </ContainerCard>
        </div>
      </div>
    </PageWrapper>
  )
}

// Whatsapp Management
export function BotSettingsSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className='flex flex-col md:flex-row gap-6 items-start'>
        <div className='flex flex-col gap-6 w-full md:w-96'>
          <SCard className='w-full shrink-0 p-0!'>
            <div className='flex flex-col gap-2 p-2'>
              <Skeleton className='h-12 w-full rounded-2xl' />
              <Skeleton className='h-12 w-full rounded-2xl' />
              <Skeleton className='h-12 w-full rounded-2xl' />
            </div>
            <Separator className='' />
            <div className='p-2 space-y-2'>
              <SCard className='border-2 space-y-6 p-4!'>
                <Skeleton className='h-6 w-32' />
                <div className='space-y-4'>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              </SCard>
              <SCard className='border-2 flex items-center justify-between p-4!'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-6 w-10' />
              </SCard>
              <SCard className='border-2 flex flex-col items-center justify-center gap-2 p-4!'>
                <Skeleton className='h-10 w-10' />
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-6 w-56' />
              </SCard>
            </div>
          </SCard>
        </div>
        <ContainerCard className='w-full'>
          <div className="flex gap-8 items-start">
            <div className='space-y-4'>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-32 w-32 rounded-full shrink-0" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </ContainerCard>
      </div>
    </PageWrapper>
  )
}

export function BotMemorySkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className='h-8 w-20' />
      </div>
      <SkeletonOverviewCards count={3} />
      <SCard className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8'>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-32 ml-auto" />
      </SCard>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ContainerCard key={i} childClass='p-0!'>
            <div className="flex w-full flex-col justify-between items-start">
              <div className="flex-1 p-6">
                <Skeleton className="h-4 w-48" />
              </div>
              <div className='border-t-2 border-gray-100 w-full py-4 px-6 flex items-center justify-between'>
                <Skeleton className='h-6 w-20' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-8' />
                  <Skeleton className='h-8 w-8' />
                </div>
              </div>
            </div>
          </ContainerCard>
        ))}
      </div>
    </PageWrapper>
  )
}

// Promotions
export function PromotionsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      <SkeletonOverviewCards count={3} />
      <Separator />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SCard key={i}>
            <div className="flex justify-between items-start mb-3">
              <div className='flex items-center gap-2'>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-7 w-24 mb-3" />
            <Skeleton className="h-3.5 w-full mb-1" />
            <Skeleton className="h-3.5 w-2/3 mb-4" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </SCard>
        ))}
      </div>
    </PageWrapper>
  )
}

export function PromotionEditSkeleton() {
  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div>
            <Skeleton className="h-8 w-52 mb-1.5" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Nome e descrizione */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-40 mb-1.5" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-3 w-72" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            </div>
          </SCard>

          {/* Card 2: Tipo di sconto */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-3.5 w-80" />
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </SCard>

          {/* Card 3: Dove si applica */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-36 mb-1.5" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            </div>
          </SCard>

          {/* Card 4: Cosa viene scontato */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-40 mb-1.5" />
              <Skeleton className="h-3.5 w-80" />
            </div>
            <div className="p-6">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </SCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Card: Stato */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-16 mb-1.5" />
              <Skeleton className="h-3.5 w-52" />
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </SCard>

          {/* Card: Periodo di validità */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-36 mb-1.5" />
              <Skeleton className="h-3.5 w-52" />
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          </SCard>

          {/* Card: Fedeltà cliente */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-32 mb-1.5" />
              <Skeleton className="h-3.5 w-52" />
            </div>
            <div className="p-6 space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full" />
            </div>
          </SCard>

          {/* Card: Notifiche */}
          <SCard className="p-0!">
            <div className="p-6 pb-4 border-b-2 border-gray-100">
              <Skeleton className="h-5 w-24 mb-1.5" />
              <Skeleton className="h-3.5 w-44" />
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-52" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full shrink-0" />
            </div>
          </SCard>
        </div>
      </div>
    </PageWrapper>
  )
}

// Collaborators
export function CollaboratorsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      <SkeletonOverviewCards count={3} />
      <SCard className='p-4!'>
        <div className="flex gap-4 justify-between items-center pb-4 border-b-2 border-gray-100 mb-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 w-10" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b-2 border-gray-50">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </SCard>
    </PageWrapper>
  )
}

// Organization Management
export function ActivitiesManagementSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-8 w-20 rounded-r-none' />
          <Skeleton className='h-8 w-20 rounded-l-none' />
        </div>
      </div>
      <SkeletonOverviewCards count={3} />
      <SCard className='flex items-start bg-card! gap-3 border-2 border-dashed border-border!'>
        <div className='space-y-1'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-5 w-100' />
        </div>
      </SCard>
      {/* Location cards */}
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SCard key={i} className="flex flex-col gap-4 px-0! pt-0!">
            <div className='flex items-center justify-between border-b-2 p-5'>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-3 px-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-7 w-7' />
                  <Skeleton className='h-7 w-60' />
                </div>
              ))}
            </div>
          </SCard>
        ))}
      </div>
    </PageWrapper>
  )
}

export function BillingSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className='grid lg:grid-cols-3 gap-6'>
        <SCard className="lg:col-span-2 h-fit flex flex-col justify-between items-start p-0!">
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 w-full'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-10 w-10' />
              <div className='space-y-1'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-7 w-14' />
              </div>
            </div>
            <Skeleton className='h-8 w-16' />
          </div>
          <Separator />
          <div className='p-5 grid md:grid-cols-2 gap-8 w-full'>
            <div>
              <div className='flex flex-col gap-4'>
                <Skeleton className="h-3.5 w-24 " />
                <div className='flex items-end gap-1'>
                  <Skeleton className="h-7 w-10 mb-1" />
                  <Skeleton className="h-5 w-32 mb-1" />
                </div>
                <Skeleton className="h-10 w-56" />
              </div>
            </div>
            <div>
              <Skeleton className='h-5 w-24 mb-3' />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <Skeleton className='w-6 h-6' />
                    <Skeleton className='w-56 md:w-32 h-5' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SCard>
        <SCard className='p-0!'>
          <div className='flex items-center gap-2 p-5'>
            <Skeleton className='h-10 w-10' />
            <div className='space-y-2'>
              <Skeleton className='h-6 w-12' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>
          <Separator />
          <div className='p-5 flex flex-col gap-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <SCard className='p-4!' key={i}>
                <Skeleton className='h-10' />
              </SCard>
            ))}
          </div>  
        </SCard>
      </div>
      {/* Plans grid */}
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {Array.from({ length: 3 }).map((_, i) => (
            <SCard key={i}>
              <Skeleton className="h-5 w-24 mb-1.5" />
              <Skeleton className="h-8 w-28 mb-4" />
              <div className="flex flex-col gap-2 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex gap-2 items-center">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 flex-1" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-9 w-full" />
            </SCard>
          ))}
        </div>
      </div>
      {/* Transactions */}
      <SCard>
        <Skeleton className="h-5 w-32 mb-4" />
        <SkeletonTableRows rows={5} cols={4} />
      </SCard>
    </PageWrapper>
  )
}

export function LimitsSkeleton() {
  return (
    <PageWrapper>
      <div className='header-container'>
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className='h-8 w-20' />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SCard key={i} className='px-0!'>
            <div className="flex items-center gap-3 mb-3 border-b-2 px-4 pb-4">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className='flex items-end justify-between mb-3 px-4 mt-5'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-3 w-16' />
            </div>
            <div className='px-4'>
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 mt-3 w-20" />
            </div>
          </SCard>
        ))}
      </div>
      {/* Analytics + Connections */}
      <div className='grid md:grid-cols-2 gap-6'>
        <SCard className='px-0! py-5!'>
          <div className='flex items-center justify-between border-b-2 px-4 pb-4'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='w-20 h-6' />
          </div>
          <div className='px-4 mt-4 flex items-center gap-2'>
            <Skeleton className='w-10 h-10' />
            <Skeleton className='w-32 h-9' />
          </div>
        </SCard>
        <SCard className='px-0! py-5!'>
          <div className='flex items-center justify-between border-b-2 px-4 pb-4'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='w-20 h-6' />
          </div>
          <div className='grid grid-cols-3 divide-x-2 gap-3 mt-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='px-4 flex items-center justify-between mt-4'>
                <Skeleton className='h-5 w-32' />
              </div>
            ))}
          </div>
        </SCard>
      </div>
      <SCard className='p-0!'>
        <div className='flex items-center gap-3 p-5 border-b-2'>
          <Skeleton className='w-20 h-6' />
        </div>
        <div className='p-5 grid grid-cols-5 gap-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between border-gray-100 border-2 p-3 rounded-2xl'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-40 sm:w-32' />
                  <Skeleton className='h-2 w-20' />
                </div>
              </div>
              <Skeleton className='h-7 w-7' />
            </div>
          ))}
        </div>
      </SCard>
    </PageWrapper>
  )
}

export function GeneralSettingsSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <ContainerCard>
            <div className='grid sm:grid-cols-2 w-full gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-8 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-3 w-72' />
              </div>
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-3 w-72' />
            </div>
            <Skeleton className='h-10 w-20 ml-auto mt-4' />
          </ContainerCard>
          <ContainerCard>
            <div className='grid sm:grid-cols-3 w-full gap-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-3 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-3 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-3 w-full' />
              </div>
            </div>
            <Skeleton className='h-10 w-20 ml-auto mt-4' />
          </ContainerCard>
        </div>
        <ContainerCard>
          <div className='grid 2xl:grid-cols-2 w-full gap-4'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-3 w-30' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-3 w-30' />
            </div>
          </div>
          <div className='mt-6 flex flex-col gap-3'>
            {Array.from({ length: 5}).map((_, i) => (
              <div key={i} className='border-2 border-gray-100 p-4 rounded-2xl'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-5 w-12' />
                </div>
                <Skeleton className='h-4 w-full mt-3 mb-1' />
                <Skeleton className='h-4 w-full' />
              </div>
            ))}
          </div>
          <Skeleton className='h-10 w-20 ml-auto mt-4' />
        </ContainerCard>
      </div>
    </PageWrapper>
  )
}

// Profile
export function ProfileSkeleton() {
  return (
    <PageWrapper>
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid xl:grid-cols-3 gap-6">
        <div className='xl:col-span-2 space-y-6'>
          <SCard className='p-0!'>
            <div className='flex items-center gap-3 p-5 border-b-2 border-gray-100'>
              <Skeleton className='w-16 h-16 rounded-2xl' />
              <div className='flex flex-col gap-2'>
                <Skeleton className='h-10 w-40' />
                <Skeleton className='h-6 w-24' />
              </div>
            </div>
            <div className='p-5 grid sm:grid-cols-2 gap-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div className='flex items-center p-4 gap-3 border-2 border-gray-100 rounded-3xl'>
                  <Skeleton className='h-10 w-10 rounded-xl' />
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-6 w-14' />
                    <Skeleton className='h-4 w-40' />
                  </div>
                </div>
              ))}
            </div>
          </SCard>
          <SCard>
            <div className='flex items-center gap-3'>
              <Skeleton className='w-8 h-8 rounded-lg' />
              <Skeleton className='h-6 w-40' />
            </div>
            <Skeleton className='h-4 w-100 mt-3' />
            <div className='border-2 border-gray-100 rounded-2xl p-4 mt-6'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-1/3 mt-2' />
            </div>
            <Skeleton className='h-8 w-56 mt-4' />
          </SCard>
        </div>
        <SCard className='h-fit'>
          <div className='mb-4 flex gap-2 items-center'>
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 border-2 border-gray-100 p-4 rounded-2xl">
                <Skeleton className="h-8 w-8" />
                <div className='flex flex-col gap-2 w-full flex-1'>
                  <Skeleton className='h-5 w-10' />
                  <Skeleton className='h-4 w-full' />
                </div>
              </div>
            ))}
          </div>
          <Separator className='my-4' />
          <div className='border-2 border-gray-100 p-4 rounded-2xl'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-1/3 mt-2' />
          </div>
        </SCard>
      </div>
    </PageWrapper>
  )
}
