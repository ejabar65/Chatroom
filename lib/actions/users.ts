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

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    return { success: false, error: "Not authorized" }
  }

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

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

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

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

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

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  const { data: targetUser } = await supabase.from("users").select("is_admin").eq("id", userId).single()

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

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  const { data: targetUser } = await supabase.from("users").select("is_throttled").eq("id", userId).single()

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

export async function shadowbanUser(userId: string, reason: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      is_shadowbanned: true,
      shadowbanned_by: user.id,
      shadowban_reason: reason,
      shadowbanned_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function unshadowbanUser(userId: string, adminKey: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  const isAuthorized = profile?.is_admin || adminKey === process.env.ADMIN_SECRET_KEY

  if (!isAuthorized) {
    return { success: false, error: "Not authorized" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      is_shadowbanned: false,
      shadowbanned_by: null,
      shadowban_reason: null,
      shadowbanned_at: null,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
