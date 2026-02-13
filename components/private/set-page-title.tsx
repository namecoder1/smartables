"use client"

import { useEffect } from "react"
import { usePageTitleOverride } from "@/components/providers/page-title-context"

interface SetPageTitleProps {
  title: string
  description: string
}

export default function SetPageTitle({ title, description }: SetPageTitleProps) {
  const { setOverride } = usePageTitleOverride()

  useEffect(() => {
    setOverride({ title, description })
    return () => setOverride(null)
  }, [title, description, setOverride])

  return null
}
