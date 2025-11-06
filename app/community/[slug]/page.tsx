import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { CommunityFeed } from "@/components/community-feed"
import { redirect, notFound } from "next/navigation"

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: preferences } = await supabase.from("user_preferences").select("layout").eq("user_id", user.id).single()

  // Fetch community
  const { data: community } = await supabase
    .from("communities")
    .select(`
      *,
      community_members (count)
    `)
    .eq("name", params.slug)
    .single()

  if (!community) {
    notFound()
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single()

  // Fetch posts in this community
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
    .eq("community_id", community.id)
    .order("created_at", { ascending: false })

  // Add member count and post count
  const communityWithCounts = {
    ...community,
    member_count: community.community_members?.[0]?.count || 0,
    post_count: posts?.length || 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <Header user={user} />
      <CommunityFeed
        community={communityWithCounts}
        posts={posts || []}
        currentUser={user}
        isMember={!!membership}
        layout={preferences?.layout || "card"}
      />
    </div>
  )
}
