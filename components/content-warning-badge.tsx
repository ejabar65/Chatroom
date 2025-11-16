import { Badge } from "@/components/ui/badge"
import { AlertTriangleIcon } from "@/components/icons"

interface ContentWarningBadgeProps {
  warning: string
}

export function ContentWarningBadge({ warning }: ContentWarningBadgeProps) {
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangleIcon className="w-3 h-3" />
      CW: {warning}
    </Badge>
  )
}
