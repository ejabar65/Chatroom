"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser, isFollowing } from "@/lib/actions/follows"
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
}

export function FollowButton({ userId }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkFollowing()
  }, [userId])

  const checkFollowing = async () => {
    const result = await isFollowing(userId)
    if (result.success) {
      setFollowing(result.isFollowing)
    }
    setLoading(false)
  }

  const handleFollow = async () => {
    setActionLoading(true)
    const result = following ? await unfollowUser(userId) : await followUser(userId)

    if (result.success) {
      setFollowing(!following)
      router.refresh()
    } else {
      alert(result.error || "Failed to update follow status")
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      onClick={handleFollow}
      disabled={actionLoading}
      className={following ? "" : "bg-indigo-600 hover:bg-indigo-700"}
    >
      {actionLoading ? "Loading..." : following ? "Following" : "Follow"}
    </Button>
  )
}
