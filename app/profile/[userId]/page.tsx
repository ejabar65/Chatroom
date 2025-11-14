import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeDisplay } from "@/components/badge-display"
import { AwardBadgeDialog } from "@/components/award-badge-dialog"
import { FollowButton } from "@/components/follow-button"
import { getUserBadges } from "@/lib/actions/badges"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CrownIcon, MessageCircleIcon } from "@/components/icons"

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect("/auth/login")
  }

  // Fetch current user's admin status
  const { data: currentUserData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single()

  // Fetch profile user data
  const { data: profileUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (userError || !profileUser) {
    notFound()
  }

  // Fetch user's posts
  const { data: posts } = await supabase
    .from("homework_posts")
    .select(
      `
      *,
      communities (id, name, display_name),
      comments:comments(count)
    `
    )
    .eq("user_id", userId)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(20)

  // Fetch user's badges
  const badgesResult = await getUserBadges(userId)
  const userBadges = badgesResult.data || []

  const initials =
    profileUser.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || profileUser.email[0].toUpperCase()

  const isOwnProfile = currentUser.id === userId

  const hasCustomName = profileUser.full_name && profileUser.full_name !== profileUser.email

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileUser.avatar_url || undefined} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              {profileUser.is_admin && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-background">
                  <CrownIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className={`text-3xl font-bold ${profileUser.is_admin ? "text-yellow-600 dark:text-yellow-400" : ""}`}
                >
                  {profileUser.full_name || "Student"}
                  {hasCustomName && (
                    <span className="text-xl text-muted-foreground font-normal ml-2">
                      ({profileUser.email})
                    </span>
                  )}
                </h1>
                {/* </CHANGE> */}
                {profileUser.is_admin && (
                  <Badge variant="destructive" className="text-sm">
                    Admin
                  </Badge>
                )}
              </div>
              {!hasCustomName && (
                <p className="text-muted-foreground mb-4">{profileUser.email}</p>
              )}

              {profileUser.bio && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">{profileUser.bio}</p>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm mb-4">
                <div>
                  <span className="font-semibold">{profileUser.post_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser.follower_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser.following_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{profileUser.badge_count || 0}</span>
                  <span className="text-muted-foreground ml-1">Badges</span>
                </div>
              </div>

              {userBadges.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">BADGES</h3>
                  <div className="flex flex-wrap gap-2">
                    {userBadges.slice(0, 6).map((badge: any) => (
                      <div
                        key={badge.id}
                        className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all hover:scale-105"
                        style={{
                          borderColor: badge.badges.color,
                          backgroundColor: `${badge.badges.color}15`,
                        }}
                      >
                        <span className="text-2xl">{badge.badges.icon}</span>
                        <span className="text-xs font-semibold">{badge.badges.name}</span>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg whitespace-nowrap border">
                            <p className="font-semibold">{badge.badges.name}</p>
                            <p className="text-muted-foreground">{badge.badges.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userBadges.length > 6 && (
                      <div className="flex items-center px-3 py-2 rounded-lg border-2 border-muted bg-muted/20">
                        <span className="text-xs font-semibold text-muted-foreground">+{userBadges.length - 6} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {!isOwnProfile && (
                  <>
                    <FollowButton userId={userId} />
                    {(currentUserData?.is_admin || true) && (
                      <AwardBadgeDialog
                        userId={userId}
                        userName={profileUser.full_name || "Student"}
                        currentUserIsAdmin={currentUserData?.is_admin || false}
                      />
                    )}
                  </>
                )}
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex-1">
            Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-6">
          {!posts || posts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
            </Card>
          ) : (
            posts.map((post: any) => {
              const commentCount = post.comments?.[0]?.count || 0

              return (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          {post.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {post.subject}
                            </Badge>
                          )}
                          {post.communities && (
                            <Badge variant="outline" className="text-xs">
                              c/{post.communities.name}
                            </Badge>
                          )}
                        </div>
                        {post.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{post.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          <span className="flex items-center gap-1">
                            <MessageCircleIcon className="w-3 h-3" />
                            {commentCount} {commentCount === 1 ? "response" : "responses"}
                          </span>
                        </div>
                      </div>
                      {post.image_url && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="object-cover w-full h-full" />
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          {userBadges.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {isOwnProfile ? "You haven't earned any badges yet" : "No badges earned yet"}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userBadges.map((badge: any) => (
                <Card key={badge.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-full border-2"
                      style={{
                        borderColor: badge.badges.color,
                        backgroundColor: `${badge.badges.color}10`,
                      }}
                    >
                      <span className="text-3xl">{badge.badges.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{badge.badges.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.badges.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Awarded {formatDistanceToNow(new Date(badge.awarded_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
