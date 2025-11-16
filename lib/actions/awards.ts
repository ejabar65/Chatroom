"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

export async function grantAward(userId: string, awardId: string, reason?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!userProfile?.is_admin) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    // Get award details
    const { data: award } = await supabase.from("awards").select("points_value").eq("id", awardId).single()

    if (!award) {
      return { success: false, error: "Award not found" }
    }

    // Grant award
    const { error: awardError } = await supabase.from("user_awards").insert({
      user_id: userId,
      award_id: awardId,
      awarded_reason: reason,
    })

    if (awardError) {
      if (awardError.code === "23505") {
        return { success: false, error: "User already has this award" }
      }
      return { success: false, error: "Failed to grant award" }
    }

    // Add karma points
    if (award.points_value > 0) {
      await addKarmaPoints(userId, award.points_value, "Award received", null, null)
    }

    revalidatePath(`/profile/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Grant award error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function addKarmaPoints(
  userId: string,
  points: number,
  reason: string,
  postId?: string | null,
  commentId?: string | null
) {
  try {
    const supabase = await createClient()

    // Update user karma
    const { error: updateError } = await supabase.rpc("increment", {
      table_name: "users",
      row_id: userId,
      column_name: "karma_points",
      x: points,
    })

    if (updateError) {
      const { data: userData } = await supabase.from("users").select("karma_points").eq("id", userId).single()
      const newKarma = (userData?.karma_points || 0) + points

      await supabase.from("users").update({ karma_points: newKarma }).eq("id", userId)
    }

    // Record in history
    await supabase.from("karma_history").insert({
      user_id: userId,
      points_change: points,
      reason,
      post_id: postId,
      comment_id: commentId,
    })

    revalidatePath(`/profile/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Add karma error:", error)
    return { success: false, error: "Failed to add karma" }
  }
}

export async function getKarmaLeaderboard(limit: number = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, karma_points, award_count")
      .order("karma_points", { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: "Failed to fetch leaderboard" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Leaderboard error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getUserKarmaHistory(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("karma_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return { success: false, error: "Failed to fetch karma history" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Karma history error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllAwards() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("awards").select("*").order("points_value", { ascending: false })

    if (error) {
      return { success: false, error: "Failed to fetch awards" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Fetch awards error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
