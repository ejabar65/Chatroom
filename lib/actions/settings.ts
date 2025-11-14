"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

export async function updateUserPreferences(formData: FormData) {
  await applyThrottle()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const darkMode = formData.get("darkMode") === "true"
  const layout = formData.get("layout") as string

  // Update user preferences
  const { error: prefError } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    dark_mode: darkMode,
    layout,
    updated_at: new Date().toISOString(),
  })

  if (prefError) {
    console.error("[v0] Error updating preferences:", prefError)
    return { success: false, error: prefError.message }
  }

  revalidatePath("/")
  revalidatePath("/settings")
  return { success: true }
}

export async function updateUserProfile(formData: FormData) {
  await applyThrottle()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const bio = formData.get("bio") as string
  const fullName = formData.get("fullName") as string

  // Validate bio length
  if (bio && bio.length > 500) {
    return { success: false, error: "Bio must be 500 characters or less" }
  }

  // Update user profile
  const { error: updateError } = await supabase
    .from("users")
    .update({
      bio: bio || null,
      full_name: fullName || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("[v0] Error updating profile:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}

export async function getUserPreferences(userId: string) {
  await applyThrottle()

  const supabase = await createClient()

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
