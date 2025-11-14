"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { strictContentFilter } from "@/lib/content-filter"

export async function getCommunities() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("communities").select("*").order("member_count", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching communities:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getCommunity(nameOrId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("communities")
    .select(`
      *,
      community_members (
        user_id,
        role,
        users (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .or(`name.eq.${nameOrId},id.eq.${nameOrId}`)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createCommunity(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const displayName = formData.get("displayName") as string
  const description = formData.get("description") as string

  if (!name || !name.trim()) {
    return { success: false, error: "Board name is required" }
  }

  const nameCheck = strictContentFilter(name)
  if (!nameCheck.safe) {
    return { success: false, error: `Board name: ${nameCheck.reason}` }
  }

  const displayNameCheck = strictContentFilter(displayName)
  if (!displayNameCheck.safe) {
    return { success: false, error: `Display name: ${displayNameCheck.reason}` }
  }

  if (description && description.trim()) {
    const descriptionCheck = strictContentFilter(description)
    if (!descriptionCheck.safe) {
      return { success: false, error: `Description: ${descriptionCheck.reason}` }
    }
  }

  // Create URL-friendly name
  const urlName = name.toLowerCase().replace(/[^a-z0-9]/g, "")

  if (urlName.length < 3) {
    return { success: false, error: "Board name must be at least 3 characters" }
  }

  const { data, error } = await supabase
    .from("communities")
    .insert({
      name: urlName,
      display_name: displayName,
      description,
      creator_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Auto-join creator as admin
  await supabase.from("community_members").insert({
    community_id: data.id,
    user_id: user.id,
    role: "admin",
  })

  revalidatePath("/")
  return { success: true, data }
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: user.id,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .match({ community_id: communityId, user_id: user.id })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true }
}

export async function getUserCommunities(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("community_members")
    .select(`
      communities (*)
    `)
    .eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data.map((item) => item.communities) }
}
