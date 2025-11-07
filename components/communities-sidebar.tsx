"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getCommunities, getUserCommunities } from "@/lib/actions/communities"

export function CommunitiesSidebar({ userId }: { userId: string }) {
  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [trendingCommunities, setTrendingCommunities] = useState<any[]>([])

  useEffect(() => {
    async function loadCommunities() {
      const [myResult, allResult] = await Promise.all([getUserCommunities(userId), getCommunities()])

      if (myResult.success) {
        setMyCommunities(myResult.data || [])
      }

      if (allResult.success) {
        setTrendingCommunities((allResult.data || []).slice(0, 5))
      }
    }

    loadCommunities()
  }, [userId])

  return (
    <div className="space-y-4">
      {/* My Communities */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">My Boards</h3>
          <Link href="/communities">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </Link>
        </div>

        {myCommunities.length === 0 ? (
          <p className="text-xs text-muted-foreground">Join boards to see them here</p>
        ) : (
          <div className="space-y-2">
            {myCommunities.map((community) => (
              <Link key={community.id} href={`/c/${community.name}`}>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {community.display_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{community.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {community.member_count}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Trending Communities */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Popular Boards</h3>
        </div>

        <div className="space-y-2">
          {trendingCommunities.map((community) => (
            <Link key={community.id} href={`/c/${community.name}`}>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {community.display_name[0]}
                  </div>
                  <span className="text-sm truncate">c/{community.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {community.member_count}
                </Badge>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/communities">
          <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
            Browse All Boards
          </Button>
        </Link>
      </Card>
    </div>
  )
}
