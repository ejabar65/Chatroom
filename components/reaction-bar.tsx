"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toggleReaction, getReactions } from "@/lib/actions/reactions"
import { REACTION_EMOJIS, type ReactionType, type ReactionCount } from "@/lib/types/reactions"
import { cn } from "@/lib/utils"

interface ReactionBarProps {
  targetId: string
  targetType: "post" | "comment"
  userId?: string
  initialReactions?: ReactionCount[]
}

export function ReactionBar({ targetId, targetType, userId, initialReactions = [] }: ReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionCount[]>(initialReactions)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadReactions()
  }, [targetId])

  const loadReactions = async () => {
    const result = await getReactions(targetId, targetType, userId)
    if (result.success) {
      setReactions(result.data)
    }
  }

  const handleReaction = async (reactionType: ReactionType) => {
    if (!userId) {
      alert("Please sign in to react")
      return
    }

    setIsLoading(true)
    const result = await toggleReaction(targetId, targetType, reactionType)

    if (result.success) {
      // Optimistic update
      setReactions((prev) => {
        const existing = prev.find((r) => r.reaction_type === reactionType)
        if (existing) {
          if (result.action === "removed") {
            const newCount = existing.count - 1
            if (newCount === 0) {
              return prev.filter((r) => r.reaction_type !== reactionType)
            }
            return prev.map((r) =>
              r.reaction_type === reactionType ? { ...r, count: newCount, user_reacted: false } : r
            )
          } else {
            return prev.map((r) =>
              r.reaction_type === reactionType ? { ...r, count: r.count + 1, user_reacted: true } : r
            )
          }
        } else {
          return [...prev, { reaction_type: reactionType, count: 1, user_reacted: true }]
        }
      })
    }

    setIsLoading(false)
  }

  const allReactionTypes: ReactionType[] = ["like", "helpful", "thanks", "smart", "fire", "laugh"]

  return (
    <div className="flex flex-wrap gap-2">
      {allReactionTypes.map((type) => {
        const reaction = reactions.find((r) => r.reaction_type === type)
        const count = reaction?.count || 0
        const userReacted = reaction?.user_reacted || false

        return (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={isLoading || !userId}
            className={cn(
              "gap-1.5 h-8 transition-all",
              userReacted && "bg-primary/10 border-primary text-primary hover:bg-primary/20",
              count > 0 && !userReacted && "hover:bg-accent"
            )}
          >
            <span className="text-base">{REACTION_EMOJIS[type]}</span>
            {count > 0 && <span className="text-xs font-medium">{count}</span>}
          </Button>
        )
      })}
    </div>
  )
}
