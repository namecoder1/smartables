"use client"

import React from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface SearchFloatingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
  children: React.ReactNode
}

const SearchFloating = ({ open, onOpenChange, placeholder, children }: SearchFloatingProps) => {
  return (
    <CommandDialog open={open}  onOpenChange={onOpenChange}>
      <CommandInput placeholder={placeholder || "Search..."} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {children}
      </CommandList>
    </CommandDialog>
  )
}

export default SearchFloating