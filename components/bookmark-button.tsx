"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookmarkIcon } from "@/components/icons"
import { toggleBookmark, checkBookmarkStatus } from "@/lib/actions/bookmarks"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  postId: string
  userId?: string
  size?: "sm" | "default"
  showLabel?: boolean
}

export function BookmarkButton({ postId, userId, size = "default", showLabel = true }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadBookmarkStatus()
    }
  }, [postId, userId])

  const loadBookmarkStatus = async () => {
    if (!userId) return
    const result = await checkBookmarkStatus(postId, userId)
    if (result.success) {
      setIsBookmarked(result.isBookmarked)
    }
  }

  const handleToggle = async () => {
    if (!userId) {
      alert("Please sign in to bookmark posts")
      return
    }

    setIsLoading(true)
    const result = await toggleBookmark(postId)

    if (result.success) {
      setIsBookmarked(result.action === "added")
    } else {
      alert(result.error || "Failed to update bookmark")
    }

    setIsLoading(false)
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={isLoading || !userId}
      className={cn(
        "gap-2",
        isBookmarked && "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400"
      )}
    >
      <BookmarkIcon className={cn("w-4 h-4", isBookmarked && "fill-current")} />
      {showLabel && (isBookmarked ? "Saved" : "Save")}
    </Button>
  )
}
