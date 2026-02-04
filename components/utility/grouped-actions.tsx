import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { EllipsisVertical } from 'lucide-react'

const GroupedActions = ({
  items,
  side = 'top'
}: {
  items: {
    label: string,
    variant?: 'outline' | 'destructive',
    icon: React.ReactNode,
    action: () => void
  }[],
  side?: 'top' | 'bottom' | 'left' | 'right'
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' side={side} className='space-y-1'>
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild>
            <Button variant={item.variant || 'outline'} onClick={item.action} className='w-full group justify-start'>
              {item.icon}
              {item.label}
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default GroupedActions