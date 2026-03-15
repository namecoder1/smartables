"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { StarButton } from "./star-button"
import { usePageTitleOverride } from "@/components/providers/page-title-context"
import { useNavData } from "@/components/providers/nav-context"

interface PageData {
  title: string
  path: {
    past?: string
    current: string
    future?: string
  }
  description: string
}

const pathToDataMap: Record<string, PageData> = {
  "/home": {
    title: "Home",
    path: { current: "Home" },
    description: "Un riassunto sulla tua situazione attuale."
  },
  "/dashboard": {
    title: "Dashboard",
    path: { current: "Dashboard" },
    description: "Panoramica dei dati per la sede corrente."
  },
  "/area-management": {
    title: "Mappa prenotazioni",
    path: { current: "Mappa prenotazioni" },
    description: "Gestisci, visualizza e modifica ordini e prenotazioni con le mappe delle tue sale"
  },
  "/reservations-management": {
    title: "Vista prenotazioni",
    path: { current: "Vista prenotazioni" },
    description: "Gestisci l'elenco delle prenotazioni."
  },
  "/reservations-calendar": {
    title: "Calendario prenotazioni",
    path: { current: "Calendario prenotazioni" },
    description: "Visualizza le prenotazioni in un calendario."
  },
  "/menus-management": {
    title: "Menù",
    path: { current: "Menù" },
    description: "Gestisci i prodotti e le categorie del tuo menù"
  },
  "/clients": {
    title: "Clienti",
    path: { current: "Clienti" },
    description: "Gestisci il database dei tuoi clienti."
  },
  "/orders": {
    title: "Ordinazioni",
    path: { current: "Ordinazioni" },
    description: "Gestisci, visualizza e modifica le ordinazioni dei tuoi tavoli"
  },
  "/orders/new": {
    title: "Nuovo ordine",
    path: { current: "Nuovo ordine" },
    description: "Crea un nuovo ordine"
  },
  "/analytics": {
    title: "Analitiche",
    path: { current: "Analitiche" },
    description: "Visualizza le statistiche della tua attività"
  },
  "/areas-management": {
    title: "Mappe ristorante",
    path: { current: "Mappe ristorante" },
    description: "Gestisci la disposizione dei tavoli e le sale"
  },
  "/site-settings": {
    title: "Dettagli ristorante",
    path: { current: "Dettagli ristorante" },
    description: "Gestisci le impostazioni della tua sede"
  },
  "/compliance": {
    title: "Modulistica",
    path: { current: "Modulistica" },
    description: "Gestisci i documenti e la modulistica"
  },
  "/collaborators-management": {
    title: "Collaboratori",
    path: { current: "Collaboratori" },
    description: "Gestisci i permessi e i collaboratori"
  },
  "/bot-settings": {
    title: "Impostazioni Bot",
    path: { current: "Impostazioni Bot" },
    description: "Gestisci le impostazioni del tuo bot"
  },
  "/bot-memory": {
    title: "Memoria Bot",
    path: { current: "Memoria Bot" },
    description: "Gestisci la memoria del tuo bot"
  },
  "/promotions": {
    title: "Promozioni",
    path: { current: "Promozioni" },
    description: "Gestisci le tue promozioni."
  },
  "/inbox": {
    title: "Inbox",
    path: { current: "Inbox" },
    description: "Gestisci le chat del tuo bot."
  },
  "/activities-management": {
    title: "Gestione sedi",
    path: { current: "Gestione sedi" },
    description: "Aggiungi o modifica le tue sedi"
  },
  "/billing": {
    title: "Fatturazione",
    path: { current: "Fatturazione" },
    description: "Informazioni sul tuo abbonamento e fatture"
  },
  "/limits": {
    title: "Limiti",
    path: { current: "Limiti" },
    description: "Gestisci i limiti del tuo account"
  },
  "/general-settings": {
    title: "Impostazioni generali",
    path: { current: "Impostazioni generali" },
    description: "Gestisci le impostazioni generali del tuo account"
  },
  "/profile": {
    title: "Profilo",
    path: { current: "Profilo" },
    description: "Gestisci il tuo profilo personale"
  },
  "/support": {
    title: "Supporto",
    path: { current: "Supporto" },
    description: "Contatta il supporto o visualizza la documentazione"
  },
  "/guides": {
    title: "Guide pratiche",
    path: { current: "Guide pratiche" },
    description: "Scopri come usare Smartables al meglio con le nostre guide passo-passo"
  },
  "/faqs": {
    title: "FAQ",
    path: { current: "FAQ" },
    description: "Trova risposte rapide alle domande più comuni su Smartables."
  },
}



interface PageTitleProps {
  title?: string
  description?: string
}

import { ChevronRight } from "lucide-react"
import Link from "next/link"

export default function PageTitle({ title, description }: PageTitleProps) {
  const pathname = usePathname()
  const { override } = usePageTitleOverride()
  const { starredPages } = useNavData()

  // Helper to get nested data from path map
  const getPageData = (path: string): PageData | null => {
    return pathToDataMap[path] || null
  }

  // Build breadcrumbs starting with Home
  const segments = pathname.split('/').filter(Boolean)
  const isHome = pathname === "/home" || pathname === "/"

  let breadcrumbs: { label: string; href: string; isLast: boolean }[] = [
    { label: "Home", href: "/home", isLast: isHome }
  ]

  if (!isHome) {
    let cumulativePath = ""
    segments.forEach((segment, index) => {
      // Skip 'home' segment if it's already root
      if (segment === "home") return

      cumulativePath += `/${segment}`
      const data = getPageData(cumulativePath)

      breadcrumbs.push({
        label: data?.title || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: cumulativePath,
        isLast: index === segments.length - 1
      })
    })
  }

  // Handle title overrides (from context or props)
  if (title || override?.title) {
    const finalTitle = title || override?.title
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].label = finalTitle!
    }
  }

  // Ensure 'isLast' is correctly synchronized for the render loop
  const finalBreadcrumbs = breadcrumbs.map((b, i) => ({
    ...b,
    isLast: i === breadcrumbs.length - 1
  }))

  const isStarred = starredPages?.some(page => page.url === pathname) || false

  return (
    <div className="hidden xl:flex xl:flex-col xl:items-start xl:justify-center pl-2">
      <div className="flex items-center gap-1.5">
        <nav className="flex items-center gap-1.5 text-sm font-medium text-white/50">
          {finalBreadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.href}-${index}`}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
              {crumb.isLast ? (
                <span className="hover:text-white text-white/90 cursor-default transition-colors font-bold tracking-tighter">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
        <StarButton
          title={finalBreadcrumbs[finalBreadcrumbs.length - 1]?.label || ""}
          url={pathname}
          isStarred={isStarred}
        />
      </div>
    </div>
  )
}
