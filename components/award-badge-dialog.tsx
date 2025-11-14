"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { awardBadge, getAllBadges } from "@/lib/actions/badges"
import { useRouter } from 'next/navigation'

interface AwardBadgeDialogProps {
  userId: string
  userName: string
  currentUserIsAdmin: boolean
  trigger?: React.ReactNode
}

export function AwardBadgeDialog({ userId, userName, currentUserIsAdmin, trigger }: AwardBadgeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [awarding, setAwarding] = useState<string | null>(null)

  const loadBadges = async () => {
    setLoading(true)
    const result = await getAllBadges()
    if (result.success) {
      // Filter badges based on user permission
      const filtered = currentUserIsAdmin
        ? result.data
        : result.data.filter((b: any) => b.can_be_awarded_by_users)
      setBadges(filtered)
    }
    setLoading(false)
  }

  const handleAward = async (badgeId: string) => {
    setAwarding(badgeId)
    const result = await awardBadge(userId, badgeId)
    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to award badge")
    }
    setAwarding(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm" onClick={loadBadges}>Award Badge</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Award Badge to {userName}</DialogTitle>
          <DialogDescription>
            {currentUserIsAdmin
              ? "As an admin, you can award any badge"
              : "You can award community badges to recognize helpful members"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading badges...</p>
          ) : badges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No badges available</p>
          ) : (
            <div className="grid gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-full border-2"
                      style={{
                        borderColor: badge.color,
                        backgroundColor: `${badge.color}10`,
                      }}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{badge.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {badge.badge_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAward(badge.id)}
                    disabled={awarding === badge.id}
                    className="shrink-0"
                  >
                    {awarding === badge.id ? "Awarding..." : "Award"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
