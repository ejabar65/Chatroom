"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Advertisement } from "@/lib/actions/advertisements"

interface BannerAdProps {
  ad: Advertisement
}

export function BannerAd({ ad }: BannerAdProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all">
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-1.5">
        <Badge variant="secondary" className="text-xs">Sponsored</Badge>
      </div>
      <CardContent className="p-0">
        <a 
          href={ad.link_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 group"
        >
          {ad.image_url && (
            <div className="relative w-32 h-20 overflow-hidden rounded-lg bg-muted shrink-0">
              <img
                src={ad.image_url || "/placeholder.svg"}
                alt={ad.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ad.description}
              </p>
            )}
          </div>
          <div className="text-sm text-primary font-medium shrink-0">
            Visit Site →
          </div>
        </a>
      </CardContent>
    </Card>
  )
}
