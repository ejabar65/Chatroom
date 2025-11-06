"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Load theme preference
    const loadTheme = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: preferences } = await supabase
          .from("user_preferences")
          .select("dark_mode")
          .eq("user_id", user.id)
          .single()

        if (preferences?.dark_mode) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }

    loadTheme()
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
