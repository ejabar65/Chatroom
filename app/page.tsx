import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { HomeworkFeed } from "@/components/homework-feed"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: preferences } = await supabase.from("user_preferences").select("layout").eq("user_id", user.id).single()

  // Fetch homework posts with user info
  const { data: posts } = await supabase
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <HomeworkFeed initialPosts={posts || []} currentUser={user} layout={preferences?.layout || "card"} />
      </main>
    </div>
  )
}
