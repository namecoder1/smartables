import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyChartStateProps {
  message?: string
  className?: string
  icon?: React.ReactNode
}

export function EmptyChartState({
  message = "Non abbiamo ancora dati per mostrati questa analitica",
  className,
  icon
}: EmptyChartStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px] border border-dashed rounded-lg bg-muted/5", className)}>
      <div className="bg-muted/50 p-3 rounded-full mb-3">
        {icon || <TrendingUp className="h-5 w-5 text-muted-foreground" />}
      </div>
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  )
}
