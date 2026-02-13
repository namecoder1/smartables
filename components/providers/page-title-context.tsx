"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface PageTitleOverride {
  title: string
  description: string
}

interface PageTitleContextValue {
  override: PageTitleOverride | null
  setOverride: (data: PageTitleOverride | null) => void
}

const PageTitleContext = createContext<PageTitleContextValue>({
  override: null,
  setOverride: () => { },
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<PageTitleOverride | null>(null)
  const setOverride = useCallback((data: PageTitleOverride | null) => setOverrideState(data), [])

  return (
    <PageTitleContext.Provider value={{ override, setOverride }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitleOverride() {
  return useContext(PageTitleContext)
}
