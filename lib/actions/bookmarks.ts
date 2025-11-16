"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

export async function toggleBookmark(postId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single()

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId)

      if (error) {
        return { success: false, error: "Failed to remove bookmark" }
      }

      revalidatePath("/")
      revalidatePath("/bookmarks")
      return { success: true, action: "removed" }
    } else {
      // Add bookmark
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, post_id: postId })

      if (error) {
        return { success: false, error: "Failed to add bookmark" }
      }

      revalidatePath("/")
      revalidatePath("/bookmarks")
      return { success: true, action: "added" }
    }
  } catch (error) {
    console.error("[v0] Bookmark error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getBookmarkedPosts(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        post_id,
        created_at,
        homework_posts:post_id (
          id,
          title,
          description,
          image_url,
          subject,
          is_flagged,
          created_at,
          users:user_id (
            id,
            full_name,
            original_name,
            avatar_url,
            email,
            is_admin
          ),
          communities:community_id (
            id,
            name,
            display_name
          ),
          comments (count)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Fetch bookmarks error:", error)
      return { success: false, error: "Failed to fetch bookmarks" }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function checkBookmarkStatus(postId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single()

    return { success: true, isBookmarked: !!data }
  } catch (error) {
    return { success: true, isBookmarked: false }
  }
}
