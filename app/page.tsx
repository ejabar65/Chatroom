import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { HomeworkFeed } from "@/components/homework-feed"
import { Header } from "@/components/header"
import { CommunitiesSidebar } from "@/components/communities-sidebar"
import { MusicSidebar } from "@/components/music-sidebar"
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: preferences } = await supabase.from("user_preferences").select("layout").eq("user_id", user.id).single()

  const { data: posts } = await supabase
    .from("homework_posts")
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        original_name,
        avatar_url,
        email
      ),
      communities:community_id (
        id,
        name,
        display_name
      ),
      comments (count)
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  const postsWithRoles = await Promise.all(
    (posts || []).map(async (post) => {
      if (post.community_id && post.user_id) {
        const { data: memberData } = await supabase
          .from("community_members")
          .select("role")
          .match({ community_id: post.community_id, user_id: post.user_id })
          .single()

        return {
          ...post,
          users: {
            ...post.users,
            memberRole: memberData?.role || null,
          },
        }
      }
      return post
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-3">
            <HomeworkFeed
              initialPosts={postsWithRoles || []}
              currentUser={user}
              layout={preferences?.layout || "card"}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CommunitiesSidebar userId={user.id} />
          </div>
        </div>
      </div>
      {/* Music Sidebar */}
      <MusicSidebar />
    </div>
  )
}
