"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    return { success: false, error: "Not authorized" }
  }

  // Fetch all users
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: users }
}

export async function banUser(userId: string, reason: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin or has admin key
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  // Ban the user
  const { error } = await supabase
    .from("users")
    .update({
      is_banned: true,
      banned_by: user.id,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function unbanUser(userId: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin or has admin key
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  // Unban the user
  const { error } = await supabase
    .from("users")
    .update({
      is_banned: false,
      banned_by: null,
      ban_reason: null,
      banned_at: null,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function toggleAdminStatus(userId: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin or has admin key
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  // Get target user's current admin status
  const { data: targetUser } = await supabase.from("users").select("is_admin").eq("id", userId).single()

  // Toggle admin status
  const { error } = await supabase
    .from("users")
    .update({
      is_admin: !targetUser?.is_admin,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function toggleThrottleStatus(userId: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin or has admin key
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  // Get target user's current throttle status
  const { data: targetUser } = await supabase.from("users").select("is_throttled").eq("id", userId).single()

  // Toggle throttle status
  const { error } = await supabase
    .from("users")
    .update({
      is_throttled: !targetUser?.is_throttled,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
