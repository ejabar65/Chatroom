"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { containsProfanity, checkImageContent } from "@/lib/content-filter"

const ADMIN_KEY = "$#GS29gs1"

export async function createPost(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get form data
    const image = formData.get("image") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const subject = formData.get("subject") as string

    if (!image || !title) {
      return { success: false, error: "Missing required fields" }
    }

    if (containsProfanity(title)) {
      return { success: false, error: "Title contains inappropriate language" }
    }

    if (description && containsProfanity(description)) {
      return { success: false, error: "Description contains inappropriate language" }
    }

    const imageCheck = await checkImageContent(image)
    if (!imageCheck.safe) {
      return { success: false, error: imageCheck.reason || "Image failed content moderation" }
    }

    // Upload image to Supabase Storage
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

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("homework").getPublicUrl(filePath)

    // Create post in database
    const { error: insertError } = await supabase.from("homework_posts").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      subject: subject || null,
      image_url: publicUrl,
    })

    if (insertError) {
      console.error("[v0] Insert error:", insertError)
      // Clean up uploaded image
      await supabase.storage.from("homework").remove([filePath])
      return { success: false, error: "Failed to create post" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deletePost(postId: string, adminKey?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get post to check ownership and get image URL
    const { data: post, error: fetchError } = await supabase
      .from("homework_posts")
      .select("user_id, image_url")
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

    // Delete post
    const { error: deleteError } = await supabase.from("homework_posts").delete().eq("id", postId)

    if (deleteError) {
      return { success: false, error: "Failed to delete post" }
    }

    // Delete image from storage
    if (post.image_url) {
      const path = post.image_url.split("/homework/")[1]
      if (path) {
        await supabase.storage.from("homework").remove([path])
      }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function flagPost(postId: string, reason: string, adminKey: string) {
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
