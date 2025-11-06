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

  // Fetch posts for this community
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <CommunityFeed community={communityData} posts={posts || []} currentUser={user} isMember={!!membership} />
    </div>
  )
}
