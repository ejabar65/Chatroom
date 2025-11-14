"use server"

import { createClient } from "@/lib/supabase/server"
import { applyUserThrottle } from "@/lib/throttle"

export async function awardBadge(userId: string, badgeId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    await applyUserThrottle(user.id)

    // Check if user is admin
    const { data: currentUser } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!currentUser?.is_admin) {
      // Check if badge can be awarded by users
      const { data: badge } = await supabase
        .from("badges")
        .select("can_be_awarded_by_users")
        .eq("id", badgeId)
        .single()

      if (!badge?.can_be_awarded_by_users) {
        return { success: false, error: "You don't have permission to award this badge" }
      }
    }

    // Check if user already has this badge
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badgeId)
      .single()

    if (existing) {
      return { success: false, error: "User already has this badge" }
    }

    // Award badge
    const { error } = await supabase.from("user_badges").insert({
      user_id: userId,
      badge_id: badgeId,
      awarded_by: user.id,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error awarding badge:", error)
    return { success: false, error: "Failed to award badge" }
  }
}

export async function removeBadge(userId: string, badgeId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    // Only admins can remove badges
    const { data: currentUser } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!currentUser?.is_admin) {
      return { success: false, error: "Only admins can remove badges" }
    }

    const { error } = await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error removing badge:", error)
    return { success: false, error: "Failed to remove badge" }
  }
}

export async function getUserBadges(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        id,
        awarded_at,
        badges (
          id,
          name,
          description,
          icon,
          color,
          badge_type
        )
      `
      )
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching user badges:", error)
    return { success: false, error: "Failed to fetch badges", data: [] }
  }
}

export async function getAllBadges() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("badges").select("*").order("name")

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching badges:", error)
    return { success: false, error: "Failed to fetch badges", data: [] }
  }
}

export async function createBadge(badge: {
  name: string
  description: string
  icon: string
  color: string
  badge_type: "achievement" | "special" | "admin"
  can_be_awarded_by_users: boolean
}) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    // Only admins can create badges
    const { data: currentUser } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!currentUser?.is_admin) {
      return { success: false, error: "Only admins can create badges" }
    }

    const { error } = await supabase.from("badges").insert(badge)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error creating badge:", error)
    return { success: false, error: "Failed to create badge" }
  }
}
