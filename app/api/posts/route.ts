import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from("homework_posts")
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          avatar_url,
          email
        ),
        comments (count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json([], { status: 500 })
  }
}
