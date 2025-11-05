"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete("sb-access-token")
  cookieStore.delete("sb-refresh-token")

  revalidatePath("/", "layout")
  redirect("/auth/login")
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile with admin status
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return profile
}
