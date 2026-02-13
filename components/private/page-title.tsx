"use client"

import { usePathname } from "next/navigation"
import { StarButton } from "./star-button"
import { usePageTitleOverride } from "@/components/providers/page-title-context"

interface PageData {
  title: string
  description: string
}

const pathToDataMap: Record<string, PageData> = {
  "/home": {
    title: "Home",
    description: "Benvenuto in Smartables! Ecco un riassunto di cosa sta succedendo oggi."
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Panoramica delle attività"
  },
  "/reservations": {
    title: "Prenotazioni",
    description: "Gestisci, visualizza e modifica le prenotazioni per i tuoi tavoli"
  },
  "/calendar": {
    title: "Calendario",
    description: "Visualizza le prenotazioni in un calendario"
  },
  "/manage-seats": {
    title: "Gestione Sala",
    description: "Gestisci la disposizione dei tavoli e le sale"
  },
  "/manage-menus": {
    title: "Gestione Menù",
    description: "Gestisci i prodotti e le categorie del tuo menù"
  },
  "/analytics": {
    title: "Analitiche",
    description: "Visualizza le statistiche della tua attività"
  },
  "/compliance": {
    title: "Modulistica",
    description: "Gestisci i documenti e la modulistica"
  },
  "/settings": {
    title: "Impostazioni Sede",
    description: "Gestisci le impostazioni della tua sede"
  },
  "/manage-activities": {
    title: "Gestisci Sedi",
    description: "Aggiungi o modifica le tue sedi"
  },
  "/manage-collaborators": {
    title: "Gestisci Collaboratori",
    description: "Gestisci i permessi e i collaboratori"
  },
  "/billing": {
    title: "Fatturazione",
    description: "Gestisci i metodi di pagamento e le fatture"
  },
  "/general-settings": {
    title: "Impostazioni Generali",
    description: "Gestisci le impostazioni generali del tuo account"
  },
  "/profile": {
    title: "Profilo",
    description: "Gestisci il tuo profilo personale"
  },
  "/support": {
    title: "Supporto",
    description: "Contatta il supporto o visualizza la documentazione"
  },
  "/guides": {
    title: "Guide pratiche",
    description: "Scopri come usare Smartables al meglio con le nostre guide passo-passo"
  },
  "/faqs": {
    title: "Domande Frequenti",
    description: "Trova risposte rapide alle domande più comuni su Smartables."
  },
}



interface PageTitleProps {
  title?: string
  description?: string
  starredPages?: { id: string; url: string; title: string }[]
}

export default function PageTitle({ title, description, starredPages }: PageTitleProps) {
  const pathname = usePathname()
  const { override } = usePageTitleOverride()

  let currentData: PageData | null = null

  // Priority: explicit props > context override > path map
  if (title) {
    currentData = { title, description: description || "" }
  } else if (override?.title) {
    currentData = { title: override.title, description: override.description }
  } else {
    const sortedKeys = Object.keys(pathToDataMap).sort((a, b) => b.length - a.length)

    for (const key of sortedKeys) {
      if (pathname.startsWith(key)) {
        currentData = pathToDataMap[key]
        break
      }
    }
  }

  if (!currentData) return null

  const isStarred = starredPages?.some(page => page.url === pathname) || false

  return (
    <div className="hidden xl:flex xl:flex-col xl:items-start xl:justify-center pl-2">
      <div className="flex items-center gap-2">
        <h1 className="xl:text-xl font-bold text-white dark:text-foreground tracking-tighter leading-5">
          {currentData.title}
        </h1>
        <StarButton title={currentData.title} url={pathname} isStarred={isStarred} />
      </div>
      <span className="text-md font-medium text-white/80 dark:text-foreground">{currentData.description}</span>
    </div>
  )
}
