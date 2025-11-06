"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserPreferences(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const darkMode = formData.get("darkMode") === "true"
  const layout = formData.get("layout") as string
  const displayName = formData.get("displayName") as string

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

  // Update display name
  if (displayName) {
    const { error: userError } = await supabase.from("users").update({ full_name: displayName }).eq("id", user.id)

    if (userError) {
      console.error("[v0] Error updating display name:", userError)
    }
  }

  revalidatePath("/")
  revalidatePath("/settings")
  return { success: true }
}

export async function getUserPreferences(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
