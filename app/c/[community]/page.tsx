import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { CommunityFeed } from "@/components/community-feed"
import { redirect } from "next/navigation"

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ community: string }>
}) {
  const { community } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch community info
  const { data: communityData } = await supabase.from("communities").select("*").eq("name", community).single()

  if (!communityData) {
    redirect("/")
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("community_members")
    .select("*")
    .match({ community_id: communityData.id, user_id: user.id })
    .single()

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
    .eq("community_id", communityData.id)
    .order("created_at", { ascending: false })

  // Fetch member roles for each post author
  const postsWithRoles = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: memberData } = await supabase
        .from("community_members")
        .select("role")
        .match({ community_id: communityData.id, user_id: post.user_id })
        .single()

      return {
        ...post,
        users: {
          ...post.users,
          memberRole: memberData?.role || null,
        },
      }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <CommunityFeed
        community={communityData}
        posts={postsWithRoles || []}
        currentUser={user}
        isMember={!!membership}
      />
    </div>
  )
}
