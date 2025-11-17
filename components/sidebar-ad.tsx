"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Advertisement } from "@/lib/actions/advertisements"

interface SidebarAdProps {
  ad: Advertisement
}

export function SidebarAd({ ad }: SidebarAdProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all">
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1.5">
        <Badge variant="secondary" className="text-xs">Sponsored</Badge>
      </div>
      <CardContent className="p-4">
        <a 
          href={ad.link_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block space-y-3 group"
        >
          {ad.image_url && (
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={ad.image_url || "/placeholder.svg"}
                alt={ad.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ad.description}
              </p>
            )}
          </div>
        </a>
      </CardContent>
    </Card>
  )
}
