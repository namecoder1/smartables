"use client"

import { Star } from "lucide-react"
import { toggleStarredPage } from "@/app/actions/starred-pages"
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StarButtonProps {
  title: string
  url: string
  isStarred: boolean
}

export function StarButton({ title, url, isStarred }: StarButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleStarredPage(title, url)
        toast.success(isStarred ? "Pagina rimossa dai preferiti" : "Pagina aggiunta ai preferiti")
      } catch (error) {
        toast.error("Errore durante l'aggiornamento dei preferiti")
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="p-1 rounded-md transition-colors"
    >
      <Star
        className={cn(
          "size-5 transition-all",
          isStarred ? "fill-yellow-400 text-yellow-400" : "text-white/80 dark:text-foreground hover:text-yellow-400"
        )}
      />
    </button>
  )
}
