import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { AdminDashboard } from "@/components/admin-dashboard"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch all posts including flagged ones
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

  // Fetch all comments including flagged ones
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email
      ),
      homework_posts!inner (
        id,
        title
      )
    `)
    .order("created_at", { ascending: false })

  // Get statistics
  const { count: totalPosts } = await supabase.from("homework_posts").select("*", { count: "exact", head: true })

  const { count: flaggedPosts } = await supabase
    .from("homework_posts")
    .select("*", { count: "exact", head: true })
    .eq("is_flagged", true)

  const { count: totalComments } = await supabase.from("comments").select("*", { count: "exact", head: true })

  const { count: flaggedComments } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("is_flagged", true)

  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <AdminDashboard
          posts={posts || []}
          comments={comments || []}
          stats={{
            totalPosts: totalPosts || 0,
            flaggedPosts: flaggedPosts || 0,
            totalComments: totalComments || 0,
            flaggedComments: flaggedComments || 0,
            totalUsers: totalUsers || 0,
          }}
        />
      </main>
    </div>
  )
}
