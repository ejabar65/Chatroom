import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BadgeData {
  id: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
    color: string
    badge_type: string
  }
  awarded_at: string
}

interface BadgeDisplayProps {
  badges: BadgeData[]
  size?: "sm" | "md" | "lg"
  showAll?: boolean
}

export function BadgeDisplay({ badges, size = "md", showAll = false }: BadgeDisplayProps) {
  const displayBadges = showAll ? badges : badges.slice(0, 5)
  const remaining = badges.length - displayBadges.length

  const sizeClasses = {
    sm: "h-6 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  }

  const iconSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  if (badges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {displayBadges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`${sizeClasses[size]} flex items-center gap-1.5 border-2 transition-all hover:scale-105`}
                style={{
                  borderColor: badge.badges.color,
                  backgroundColor: `${badge.badges.color}10`,
                  color: badge.badges.color,
                }}
              >
                <span className={iconSizeClasses[size]}>{badge.badges.icon}</span>
                <span className="font-medium">{badge.badges.name}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{badge.badges.name}</p>
              <p className="text-xs text-muted-foreground">{badge.badges.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {!showAll && remaining > 0 && (
          <Badge variant="outline" className={`${sizeClasses[size]} bg-muted`}>
            +{remaining}
          </Badge>
        )}
      </TooltipProvider>
    </div>
  )
}
