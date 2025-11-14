"use server"

import { createClient } from "@/lib/supabase/server"
import { applyUserThrottle } from "@/lib/throttle"
import type { ReactionType } from "@/lib/types/reactions"

export async function toggleReaction(
  targetId: string,
  targetType: "post" | "comment",
  reactionType: ReactionType
) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to react" }
    }

    await applyUserThrottle(user.id)

    const field = targetType === "post" ? "post_id" : "comment_id"

    // Check if user already reacted with this type
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("user_id", user.id)
      .eq(field, targetId)
      .eq("reaction_type", reactionType)
      .single()

    if (existing) {
      // Remove reaction
      const { error } = await supabase.from("reactions").delete().eq("id", existing.id)

      if (error) throw error

      return { success: true, action: "removed" }
    } else {
      // Add reaction
      const insertData: any = {
        user_id: user.id,
        reaction_type: reactionType,
      }
      insertData[field] = targetId

      const { error } = await supabase.from("reactions").insert(insertData)

      if (error) throw error

      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("Error toggling reaction:", error)
    return { success: false, error: "Failed to update reaction" }
  }
}

export async function getReactions(targetId: string, targetType: "post" | "comment", userId?: string) {
  const supabase = await createClient()

  try {
    const field = targetType === "post" ? "post_id" : "comment_id"

    const { data: reactions, error } = await supabase.from("reactions").select("*").eq(field, targetId)

    if (error) throw error

    // Group by reaction type and count
    const counts = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.reaction_type]) {
          acc[reaction.reaction_type] = {
            reaction_type: reaction.reaction_type,
            count: 0,
            user_reacted: false,
          }
        }
        acc[reaction.reaction_type].count++
        if (userId && reaction.user_id === userId) {
          acc[reaction.reaction_type].user_reacted = true
        }
        return acc
      },
      {} as Record<string, any>
    )

    return { success: true, data: Object.values(counts) }
  } catch (error) {
    console.error("Error fetching reactions:", error)
    return { success: false, error: "Failed to fetch reactions", data: [] }
  }
}
