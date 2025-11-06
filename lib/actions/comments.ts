"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { containsProfanity } from "@/lib/content-filter"

const ADMIN_KEY = "$#GS29gs1"

export async function createComment(postId: string, content: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    if (!content.trim()) {
      return { success: false, error: "Comment cannot be empty" }
    }

    if (containsProfanity(content)) {
      return { success: false, error: "Comment contains inappropriate language" }
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    })

    if (error) {
      console.error("[v0] Comment insert error:", error)
      return { success: false, error: "Failed to post comment" }
    }

    revalidatePath(`/post/${postId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function flagComment(commentId: string, adminKey: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase.from("comments").update({ is_flagged: true }).eq("id", commentId)

    if (error) {
      return { success: false, error: "Failed to flag comment" }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("[v0] Flag error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function unflagComment(commentId: string, adminKey: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase.from("comments").update({ is_flagged: false }).eq("id", commentId)

    if (error) {
      return { success: false, error: "Failed to unflag comment" }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unflag error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteComment(commentId: string, adminKey?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: comment } = await supabase.from("comments").select("user_id").eq("id", commentId).single()

    if (!comment) {
      return { success: false, error: "Comment not found" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    const isOwner = comment.user_id === user.id
    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isOwner && !isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized" }
    }

    const { error } = await supabase.from("comments").delete().eq("id", commentId)

    if (error) {
      return { success: false, error: "Failed to delete comment" }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
