"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

// User blocking functions
export async function blockUser(blockedId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    if (user.id === blockedId) {
      return { success: false, error: "Cannot block yourself" }
    }

    const { error } = await supabase.from("user_blocks").insert({
      blocker_id: user.id,
      blocked_id: blockedId,
    })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "User already blocked" }
      }
      return { success: false, error: "Failed to block user" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Block user error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function unblockUser(blockedId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .match({ blocker_id: user.id, blocked_id: blockedId })

    if (error) {
      return { success: false, error: "Failed to unblock user" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unblock user error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getBlockedUsers(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_blocks")
      .select(`
        blocked_id,
        users:blocked_id (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq("blocker_id", userId)

    if (error) {
      return { success: false, error: "Failed to fetch blocked users" }
    }

    return { success: true, data: data.map((item) => item.users) }
  } catch (error) {
    console.error("[v0] Fetch blocked users error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function isUserBlocked(userId: string, targetId: string) {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from("user_blocks")
      .select("id")
      .match({ blocker_id: userId, blocked_id: targetId })
      .single()

    return { success: true, isBlocked: !!data }
  } catch (error) {
    return { success: true, isBlocked: false }
  }
}

// Post collections functions
export async function createCollection(name: string, description: string, isPublic: boolean) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("post_collections")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim(),
        is_public: isPublic,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: "Failed to create collection" }
    }

    revalidatePath("/profile")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Create collection error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function addPostToCollection(collectionId: string, postId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase.from("collection_posts").insert({
      collection_id: collectionId,
      post_id: postId,
    })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Post already in collection" }
      }
      return { success: false, error: "Failed to add post to collection" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Add to collection error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function removePostFromCollection(collectionId: string, postId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("collection_posts")
      .delete()
      .match({ collection_id: collectionId, post_id: postId })

    if (error) {
      return { success: false, error: "Failed to remove post from collection" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Remove from collection error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getUserCollections(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("post_collections")
      .select(`
        *,
        collection_posts (count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: "Failed to fetch collections" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Fetch collections error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteCollection(collectionId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase.from("post_collections").delete().eq("id", collectionId)

    if (error) {
      return { success: false, error: "Failed to delete collection" }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete collection error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// User flairs functions
export async function setUserFlair(flairText: string, flairColor: string, communityId?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("user_flairs")
      .upsert(
        {
          user_id: user.id,
          community_id: communityId || null,
          flair_text: flairText.trim(),
          flair_color: flairColor,
          is_custom: true,
        },
        {
          onConflict: communityId ? "user_id,community_id" : "user_id",
        }
      )

    if (error) {
      return { success: false, error: "Failed to set flair" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Set flair error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getUserFlair(userId: string, communityId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase.from("user_flairs").select("*").eq("user_id", userId)

    if (communityId) {
      query = query.eq("community_id", communityId)
    } else {
      query = query.is("community_id", null)
    }

    const { data, error } = await query.single()

    if (error) {
      return { success: true, data: null }
    }

    return { success: true, data }
  } catch (error) {
    return { success: true, data: null }
  }
}

export async function removeUserFlair(communityId?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    let query = supabase.from("user_flairs").delete().eq("user_id", user.id)

    if (communityId) {
      query = query.eq("community_id", communityId)
    } else {
      query = query.is("community_id", null)
    }

    const { error } = await query

    if (error) {
      return { success: false, error: "Failed to remove flair" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Remove flair error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
