"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircleIcon, AlertTriangleIcon, BookOpenIcon } from "@/components/icons"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  title: string
  description: string | null
  image_url: string
  subject: string | null
  is_flagged: boolean
  created_at: string
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    memberRole?: string | null // Added member role
  }
  communities?: {
    id: string
    name: string
    display_name: string
  } | null
  comments: { count: number }[]
}

interface HomeworkFeedProps {
  initialPosts: Post[]
  currentUser: {
    id: string
    is_admin: boolean
  }
  layout?: "card" | "list" | "compact"
}

export function HomeworkFeed({ initialPosts, currentUser, layout = "card" }: HomeworkFeedProps) {
  const [posts, setPosts] = useState(initialPosts)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/posts")
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        }
      } catch (error) {
        console.error("Failed to refresh posts:", error)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No homework posts yet</h2>
        <p className="text-muted-foreground mb-6">Be the first to ask for help!</p>
        <Link href="/post/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Post Your Homework</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Recent Questions</h2>
        <p className="text-sm text-muted-foreground">{posts.length} posts</p>
      </div>

      {layout === "card" && <CardLayout posts={posts} currentUser={currentUser} />}
      {layout === "list" && <ListLayout posts={posts} currentUser={currentUser} />}
      {layout === "compact" && <CompactLayout posts={posts} currentUser={currentUser} />}
    </div>
  )
}

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

function CardLayout({ posts, currentUser }: { posts: Post[]; currentUser: { id: string; is_admin: boolean } }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const commentCount = post.comments?.[0]?.count || 0
        const initials =
          post.users.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || post.users.email[0].toUpperCase()

        return (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.users.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {post.communities && (
                        <Link href={`/c/${post.communities.name}`}>
                          <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                            c/{post.communities.name}
                          </Badge>
                        </Link>
                      )}
                      <p className="font-medium text-sm">{post.users.full_name || "Student"}</p>
                      {getRoleBadge(post.users.memberRole)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {post.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {post.subject}
                    </Badge>
                  )}
                  {post.is_flagged && currentUser.is_admin && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangleIcon className="w-3 h-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <h3 className="font-semibold text-lg text-balance">{post.title}</h3>
              {post.description && <p className="text-sm text-muted-foreground text-pretty">{post.description}</p>}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={post.image_url || "/placeholder.svg"}
                  alt={post.title}
                  className="object-contain w-full h-full"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-3">
              <Link href={`/post/${post.id}`} className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  <MessageCircleIcon className="w-4 h-4 mr-2" />
                  {commentCount === 0
                    ? "Be the first to help"
                    : `${commentCount} ${commentCount === 1 ? "response" : "responses"}`}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function ListLayout({ posts, currentUser }: { posts: Post[]; currentUser: { id: string; is_admin: boolean } }) {
  return (
    <div className="space-y-2">
      {posts.map((post) => {
        const commentCount = post.comments?.[0]?.count || 0
        const initials =
          post.users.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || post.users.email[0].toUpperCase()

        return (
          <Link key={post.id} href={`/post/${post.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.users.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>

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
                        <AlertTriangleIcon className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{post.users.full_name || "Student"}</span>
                    {getRoleBadge(post.users.memberRole)}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageCircleIcon className="w-3 h-3" />
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

function CompactLayout({ posts, currentUser }: { posts: Post[]; currentUser: { id: string; is_admin: boolean } }) {
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
                        <AlertTriangleIcon className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <span>{post.users.full_name || "Student"}</span>
                    {getRoleBadge(post.users.memberRole)}
                  </div>
                  <span className="flex items-center gap-1">
                    <MessageCircleIcon className="w-3 h-3" />
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
