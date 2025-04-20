import { Activity, CheckCircle2, PauseCircle, XCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        active: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
        paused: "bg-yellow-100 text-yellow-800",
        pending: "bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "active",
    },
  }
)

interface PipelineStatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: string
  className?: string
}

export function PipelineStatusBadge({ status, className }: PipelineStatusBadgeProps) {
  // Map status to variant
  const statusToVariant: Record<string, "active" | "failed" | "paused" | "pending"> = {
    active: "active",
    failed: "failed",
    paused: "paused",
    pending: "pending",
  }
  
  const variant = statusToVariant[status] || "pending"
  
  // Map status to icon
  const StatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3" />
      case "failed":
        return <XCircle className="h-3 w-3" />
      case "paused":
        return <PauseCircle className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }
  
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      <StatusIcon />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
