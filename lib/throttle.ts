"use server"

import { createClient } from "@/lib/supabase/server"

// Check if the current user is throttled
export async function checkUserThrottle(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from("users")
    .select("is_throttled")
    .eq("id", user.id)
    .single()

  return profile?.is_throttled === true
}

// Apply artificial delay for throttled users
export async function applyThrottle() {
  const isThrottled = await checkUserThrottle()
  
  if (isThrottled) {
    // Random delay between 3-8 seconds to make it feel laggy and unusable
    const delay = Math.floor(Math.random() * 5000) + 3000
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}
