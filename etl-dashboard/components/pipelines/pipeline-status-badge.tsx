import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PipelineStatusBadgeProps {
  status: string
  className?: string
}

export function PipelineStatusBadge({ status, className }: PipelineStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        {
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400":
            status === "active" || status === "completed",
          "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400": status === "failed",
          "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400": status === "pending",
        },
        className,
      )}
    >
      {status}
    </Badge>
  )
}
