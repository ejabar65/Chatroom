"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, AlertTriangle } from "lucide-react"
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
  }
  comments: { count: number }[]
}

interface HomeworkFeedProps {
  initialPosts: Post[]
  currentUser: {
    id: string
    is_admin: boolean
  }
}

export function HomeworkFeed({ initialPosts, currentUser }: HomeworkFeedProps) {
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
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
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
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{post.users.full_name || "Student"}</p>
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
                        <AlertTriangle className="w-3 h-3 mr-1" />
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
                    <MessageCircle className="w-4 h-4 mr-2" />
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
    </div>
  )
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
