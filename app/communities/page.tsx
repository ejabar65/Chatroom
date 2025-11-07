import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { CreateCommunityDialog } from "@/components/create-community-dialog"

export default async function CommunitiesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch all communities
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .order("member_count", { ascending: false })

  // Fetch user's memberships
  const { data: memberships } = await supabase.from("community_members").select("community_id").eq("user_id", user.id)

  const userCommunityIds = new Set(memberships?.map((m) => m.community_id) || [])

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Browse Boards</h1>
            <p className="text-muted-foreground mt-1">Join boards to see posts from your favorite subjects</p>
          </div>
          <CreateCommunityDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {communities?.map((community) => {
            const isMember = userCommunityIds.has(community.id)

            return (
              <Card key={community.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white">
                      {community.display_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{community.display_name}</h3>
                      <p className="text-sm text-muted-foreground">c/{community.name}</p>
                    </div>
                  </div>
                  {isMember && (
                    <Badge variant="secondary" className="text-xs">
                      Joined
                    </Badge>
                  )}
                </div>

                {community.description && <p className="text-sm text-muted-foreground mb-4">{community.description}</p>}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{community.member_count} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{community.post_count} posts</span>
                  </div>
                </div>

                <Link href={`/c/${community.name}`}>
                  <Button variant={isMember ? "outline" : "default"} className="w-full">
                    {isMember ? "View Board" : "Join Board"}
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
