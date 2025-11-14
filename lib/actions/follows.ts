"use server"

import { createClient } from "@/lib/supabase/server"
import { applyUserThrottle } from "@/lib/throttle"

export async function followUser(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    if (user.id === followingId) {
      return { success: false, error: "You cannot follow yourself" }
    }

    await applyUserThrottle(user.id)

    // Check if already following
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single()

    if (existing) {
      return { success: false, error: "Already following this user" }
    }

    // Create follow relationship
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: followingId,
    })

    if (error) throw error

    // Update follower count
    await supabase.rpc("increment", {
      table_name: "users",
      row_id: followingId,
      column_name: "follower_count",
    })

    // Update following count
    await supabase.rpc("increment", {
      table_name: "users",
      row_id: user.id,
      column_name: "following_count",
    })

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, error: "Failed to follow user" }
  }
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in" }
    }

    await applyUserThrottle(user.id)

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId)

    if (error) throw error

    // Update follower count
    await supabase.rpc("decrement", {
      table_name: "users",
      row_id: followingId,
      column_name: "follower_count",
    })

    // Update following count
    await supabase.rpc("decrement", {
      table_name: "users",
      row_id: user.id,
      column_name: "following_count",
    })

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, error: "Failed to unfollow user" }
  }
}

export async function isFollowing(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, isFollowing: false }
    }

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single()

    return { success: true, isFollowing: !!data }
  } catch (error) {
    return { success: true, isFollowing: false }
  }
}

export async function getFollowers(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        id,
        created_at,
        follower:users!follows_follower_id_fkey (
          id,
          full_name,
          email,
          avatar_url,
          badge_count
        )
      `
      )
      .eq("following_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching followers:", error)
    return { success: false, error: "Failed to fetch followers", data: [] }
  }
}

export async function getFollowing(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        id,
        created_at,
        following:users!follows_following_id_fkey (
          id,
          full_name,
          email,
          avatar_url,
          badge_count
        )
      `
      )
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching following:", error)
    return { success: false, error: "Failed to fetch following", data: [] }
  }
}
