import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Sync user to database
      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata.full_name || data.user.user_metadata.name || null,
          avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
