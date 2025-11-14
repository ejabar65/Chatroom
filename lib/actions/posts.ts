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
