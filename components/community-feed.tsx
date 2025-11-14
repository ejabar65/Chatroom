"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, AlertTriangle } from 'lucide-react'
import { CrownIcon } from "@/components/icons"
import Link from "next/link"
import { joinCommunity, leaveCommunity } from "@/lib/actions/communities"
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from "date-fns"

function getRoleBadge(role: string | null | undefined) {
  if (!role || role === "member") return null

  const roleConfig = {
    admin: { label: "Admin", variant: "destructive" as const },
    moderator: { label: "Mod", variant: "default" as const },
  }

  const config = roleConfig[role as keyof typeof roleConfig]
  if (!config) return null

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}

function isAdmin(role: string | null | undefined): boolean {
  return role === "admin"
}

export function CommunityFeed({
  community,
  posts,
  currentUser,
  isMember,
  layout = "card",
}: {
  community: any
  posts: any[]
  currentUser: any
  isMember: boolean
  layout?: "card" | "list" | "compact"
}) {
  const [joined, setJoined] = useState(isMember)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleJoinLeave = async () => {
    setLoading(true)
    if (joined) {
      await leaveCommunity(community.id)
      setJoined(false)
    } else {
      await joinCommunity(community.id)
      setJoined(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Community Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
              {community.display_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{community.display_name}</h1>
              <p className="text-muted-foreground">c/{community.name}</p>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{community.member_count} members</span>
                <span>{community.post_count} posts</span>
              </div>
            </div>
          </div>
          <Button onClick={handleJoinLeave} disabled={loading}>
            {joined ? "Leave" : "Join"}
          </Button>
        </div>
        {community.description && <p className="mt-4 text-muted-foreground">{community.description}</p>}
      </Card>

      {/* Create Post Button */}
      {joined && (
        <Link href={`/post/new?community=${community.id}`}>
          <Button className="w-full mb-6">Create Post in c/{community.name}</Button>
        </Link>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No posts yet. Be the first to post!</Card>
      ) : (
        <>
          {layout === "card" && <CardLayout posts={posts} currentUser={currentUser} />}
          {layout === "list" && <ListLayout posts={posts} currentUser={currentUser} />}
          {layout === "compact" && <CompactLayout posts={posts} currentUser={currentUser} />}
        </>
      )}
    </main>
  )
}

function CardLayout({ posts, currentUser }: { posts: any[]; currentUser: any }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link key={post.id} href={`/post/${post.id}`}>
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex gap-4">
              <Link href={`/profile/${post.users.id}`} onClick={(e) => e.stopPropagation()}>
                <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar>
                    <AvatarImage src={post.users.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{post.users.full_name?.[0] || post.users.email[0]}</AvatarFallback>
                  </Avatar>
                  {isAdmin(post.users.memberRole) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background">
                      <CrownIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </Link>
              {/* </CHANGE> */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-medium ${isAdmin(post.users.memberRole) ? "text-yellow-600 dark:text-yellow-400" : ""}`}
                  >
                    {post.users.full_name || post.users.email}
                    {post.users.full_name && post.users.full_name !== post.users.email && (
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        ({post.users.email})
                      </span>
                    )}
                  </span>
                  {getRoleBadge(post.users.memberRole)}
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                  {post.subject && <Badge variant="secondary">{post.subject}</Badge>}
                  {post.is_flagged && currentUser.is_admin && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                <p className="text-muted-foreground line-clamp-2">{post.description}</p>
                {post.image_url && (
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.title}
                    className="mt-3 rounded-lg max-h-64 object-cover"
                  />
                )}
                <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments[0]?.count || 0} comments
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function ListLayout({ posts, currentUser }: { posts: any[]; currentUser: any }) {
  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const commentCount = post.comments?.[0]?.count || 0
        const initials = post.users.full_name?.[0] || post.users.email[0]

        return (
          <Link key={post.id} href={`/post/${post.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <Link href={`/profile/${post.users.id}`} onClick={(e) => e.stopPropagation()}>
                  <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.users.avatar_url || undefined} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                    </Avatar>
                    {isAdmin(post.users.memberRole) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background">
                        <CrownIcon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </Link>
                {/* </CHANGE> */}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{post.title}</h3>
                    {post.subject && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {post.subject}
                      </Badge>
                    )}
                    {post.is_flagged && currentUser.is_admin && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className={
                        isAdmin(post.users.memberRole) ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""
                      }
                    >
                      {post.users.full_name || "Student"}
                      {post.users.full_name && post.users.full_name !== post.users.email && (
                        <span className="ml-1">({post.users.email})</span>
                      )}
                    </span>
                    {getRoleBadge(post.users.memberRole)}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {commentCount}
                    </span>
                  </div>
                </div>

                {post.image_url && (
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function CompactLayout({ posts, currentUser }: { posts: any[]; currentUser: any }) {
  return (
    <div className="space-y-1">
      {posts.map((post) => {
        const commentCount = post.comments?.[0]?.count || 0

        return (
          <Link key={post.id} href={`/post/${post.id}`}>
            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{post.title}</h3>
                    {post.subject && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {post.subject}
                      </Badge>
                    )}
                    {post.is_flagged && currentUser.is_admin && (
                      <Badge variant="destructive" className="text-xs shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={
                        isAdmin(post.users.memberRole) ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""
                      }
                    >
                      {post.users.full_name || "Student"}
                      {post.users.full_name && post.users.full_name !== post.users.email && (
                        <span className="ml-1">({post.users.email})</span>
                      )}
                    </span>
                    {getRoleBadge(post.users.memberRole)}
                  </div>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {commentCount}
                  </span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
