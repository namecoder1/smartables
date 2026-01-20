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
    variant?: 'default' | 'destructive',
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
      <DropdownMenuContent align='end' side={side}>
        {items.map((item, index) => (
          <DropdownMenuItem variant={item.variant} key={index} onClick={item.action}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default GroupedActions