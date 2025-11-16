import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { AdminDashboard } from "@/components/admin-dashboard"
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:reporter_id (id, full_name, email),
      reported_user:reported_user_id (id, full_name, email),
      reported_post:reported_post_id (id, title),
      reported_comment:reported_comment_id (id, content)
    `)
    .order("created_at", { ascending: false })

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

  const { data: allUsers } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  const { data: communities } = await supabase
    .from("communities")
    .select(`
      *,
      creator:creator_id (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

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

  const { count: pendingReports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <AdminDashboard
          posts={posts || []}
          comments={comments || []}
          users={allUsers || []}
          reports={reports || []}
          communities={communities || []}
          stats={{
            totalPosts: totalPosts || 0,
            flaggedPosts: flaggedPosts || 0,
            totalComments: totalComments || 0,
            flaggedComments: flaggedComments || 0,
            totalUsers: totalUsers || 0,
            pendingReports: pendingReports || 0,
          }}
        />
      </main>
    </div>
  )
}
