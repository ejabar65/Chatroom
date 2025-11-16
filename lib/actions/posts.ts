"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { strictContentFilter, checkImageContent } from "@/lib/content-filter"
import { applyThrottle } from "@/lib/throttle"

const ADMIN_KEY = "$#GS29gs1"

export async function createPost(formData: FormData) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const image = formData.get("image") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const subject = formData.get("subject") as string
    const communityId = formData.get("communityId") as string

    if (!image || !title) {
      return { success: false, error: "Missing required fields" }
    }

    if (!communityId) {
      return { success: false, error: "Please select a board for your post" }
    }

    const titleCheck = strictContentFilter(title)
    if (!titleCheck.safe) {
      return { success: false, error: `Title: ${titleCheck.reason}` }
    }

    if (description && description.trim()) {
      const descriptionCheck = strictContentFilter(description)
      if (!descriptionCheck.safe) {
        return { success: false, error: `Description: ${descriptionCheck.reason}` }
      }
    }

    if (subject && subject.trim()) {
      const subjectCheck = strictContentFilter(subject)
      if (!subjectCheck.safe) {
        return { success: false, error: `Subject: ${subjectCheck.reason}` }
      }
    }

    const imageCheck = await checkImageContent(image)
    if (!imageCheck.safe) {
      return { success: false, error: imageCheck.reason || "Image failed content moderation" }
    }

    const fileExt = image.name.split(".").pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `homework-images/${fileName}`

    const { error: uploadError } = await supabase.storage.from("homework").upload(filePath, image, {
      contentType: image.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return { success: false, error: "Failed to upload image" }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("homework").getPublicUrl(filePath)

    const { error: insertError } = await supabase.from("homework_posts").insert({
      user_id: user.id,
      community_id: communityId,
      title: title.trim(),
      description: description.trim() || null,
      subject: subject || null,
      image_url: publicUrl,
    })

    if (insertError) {
      console.error("[v0] Insert error:", insertError)
      await supabase.storage.from("homework").remove([filePath])
      return { success: false, error: "Failed to create post" }
    }

    revalidatePath("/")
    revalidatePath(`/c/${communityId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deletePost(postId: string, adminKey?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: post, error: fetchError } = await supabase
      .from("homework_posts")
      .select("user_id, image_url, community_id")
      .eq("id", postId)
      .single()

    if (fetchError || !post) {
      return { success: false, error: "Post not found" }
    }

    const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    const isOwner = post.user_id === user.id
    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isOwner && !isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized" }
    }

    const { error: deleteError } = await supabase.from("homework_posts").delete().eq("id", postId)

    if (deleteError) {
      return { success: false, error: "Failed to delete post" }
    }

    if (post.image_url) {
      const path = post.image_url.split("/homework/")[1]
      if (path) {
        await supabase.storage.from("homework").remove([path])
      }
    }

    revalidatePath("/")
    revalidatePath(`/c/${post.community_id}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function flagPost(postId: string, reason: string, adminKey: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({ is_flagged: true, flag_reason: reason })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to flag post" }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Flag error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function unflagPost(postId: string, adminKey: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({ is_flagged: false, flag_reason: null })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to unflag post" }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unflag error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function pinPost(postId: string, adminKey?: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({ is_pinned: true, pinned_by: user.id, pinned_at: new Date().toISOString() })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to pin post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Pin error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function unpinPost(postId: string, adminKey?: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({ is_pinned: false, pinned_by: null, pinned_at: null })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to unpin post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unpin error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function lockPost(postId: string, reason: string, adminKey?: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({
        is_locked: true,
        locked_by: user.id,
        locked_at: new Date().toISOString(),
        lock_reason: reason
      })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to lock post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Lock error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function unlockPost(postId: string, adminKey?: string) {
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

    const isAdminByKey = adminKey === ADMIN_KEY
    const isAdminByDb = userProfile?.is_admin === true

    if (!isAdminByKey && !isAdminByDb) {
      return { success: false, error: "Not authorized - admin access required" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({
        is_locked: false,
        locked_by: null,
        locked_at: null,
        lock_reason: null
      })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to unlock post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unlock error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updatePostFlair(postId: string, flairText: string, flairColor: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: post } = await supabase
      .from("homework_posts")
      .select("user_id")
      .eq("id", postId)
      .single()

    if (!post || post.user_id !== user.id) {
      return { success: false, error: "Not authorized" }
    }

    const { error } = await supabase
      .from("homework_posts")
      .update({ flair_text: flairText || null, flair_color: flairColor || null })
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to update flair" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Flair error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updatePost(postId: string, updates: { title?: string; description?: string; subject?: string }, reason?: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: currentPost } = await supabase
      .from("homework_posts")
      .select("user_id, title, description, subject")
      .eq("id", postId)
      .single()

    if (!currentPost || currentPost.user_id !== user.id) {
      return { success: false, error: "Not authorized" }
    }

    await supabase.from("post_edit_history").insert({
      post_id: postId,
      edited_by: user.id,
      title_before: currentPost.title,
      description_before: currentPost.description,
      subject_before: currentPost.subject,
      edit_reason: reason
    })

    const { error } = await supabase
      .from("homework_posts")
      .update(updates)
      .eq("id", postId)

    if (error) {
      return { success: false, error: "Failed to update post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Update error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getPostEditHistory(postId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("post_edit_history")
      .select(`
        *,
        users:edited_by (
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("edited_at", { ascending: false })

    if (error) {
      return { success: false, error: "Failed to fetch edit history" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Fetch edit history error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
