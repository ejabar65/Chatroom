"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, SendIcon, TrashIcon, AlertTriangleIcon, CrownIcon } from "@/components/icons"
import { formatDistanceToNow } from "date-fns"
import { createComment } from "@/lib/actions/comments"
import { deletePost } from "@/lib/actions/posts"
import Link from "next/link"
import { ReactionBar } from "@/components/reaction-bar"

interface Comment {
  id: string
  content: string
  created_at: string
  is_flagged: boolean
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    is_admin: boolean
  }
}

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
    is_admin: boolean
  }
  comments: Comment[]
}

interface PostDetailProps {
  post: Post
  currentUser: {
    id: string
    is_admin: boolean
  }
}

function isAdmin(user: any): boolean {
  return user?.is_admin === true
}

export function PostDetail({ post, currentUser }: PostDetailProps) {
  const router = useRouter()
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const initials =
    post.users.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || post.users.email[0].toUpperCase()

  const postAuthorDisplayName = post.users.full_name || "Student"
  const postAuthorHasCustomName = post.users.full_name && post.users.full_name !== post.users.email
  // </CHANGE>

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createComment(post.id, comment.trim())
      if (result.success) {
        setComment("")
        router.refresh()
      } else {
        alert(result.error || "Failed to post comment")
      }
    } catch (error) {
      console.error("[v0] Error posting comment:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setIsDeleting(true)
    try {
      const result = await deletePost(post.id)
      if (result.success) {
        router.push("/")
        router.refresh()
      } else {
        alert(result.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete = currentUser.id === post.users.id || currentUser.is_admin

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.users.id}`}>
                <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.users.avatar_url || undefined} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                  </Avatar>
                  {isAdmin(post.users) && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background">
                      <CrownIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              </Link>
              {/* </CHANGE> */}
              <div>
                <p className={`font-medium ${isAdmin(post.users) ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                  {postAuthorDisplayName}
                  {postAuthorHasCustomName && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({post.users.email})
                    </span>
                  )}
                </p>
                {/* </CHANGE> */}
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {post.subject && <Badge variant="secondary">{post.subject}</Badge>}
              {post.is_flagged && currentUser.is_admin && (
                <Badge variant="destructive">
                  <AlertTriangleIcon className="w-3 h-3 mr-1" />
                  Flagged
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold text-balance">{post.title}</h1>
          {post.description && <p className="text-muted-foreground text-pretty">{post.description}</p>}
          <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
            <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="w-full h-auto" />
          </div>
          
          <div className="pt-2">
            <ReactionBar targetId={post.id} targetType="post" userId={currentUser.id} />
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Responses ({post.comments.length})</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              placeholder="Share your help or solution..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{comment.length}/2000 characters</p>
              <Button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <SendIcon className="w-4 h-4 mr-2" />
                Post Response
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {post.comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No responses yet. Be the first to help!</p>
          ) : (
            <div className="space-y-4">
              {post.comments
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((comment) => {
                  const commentInitials =
                    comment.users.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || comment.users.email[0].toUpperCase()

                  const commentAuthorDisplayName = comment.users.full_name || "Student"
                  const commentAuthorHasCustomName = comment.users.full_name && comment.users.full_name !== comment.users.email
                  // </CHANGE>

                  return (
                    <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                      <Link href={`/profile/${comment.users.id}`}>
                        <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar>
                            <AvatarImage src={comment.users.avatar_url || undefined} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">{commentInitials}</AvatarFallback>
                          </Avatar>
                          {isAdmin(comment.users) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background">
                              <CrownIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium text-sm ${isAdmin(comment.users) ? "text-yellow-600 dark:text-yellow-400" : ""}`}
                          >
                            {commentAuthorDisplayName}
                            {commentAuthorHasCustomName && (
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                ({comment.users.email})
                              </span>
                            )}
                          </p>
                          {/* </CHANGE> */}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                          {comment.is_flagged && currentUser.is_admin && (
                            <Badge variant="destructive" className="text-xs">
                              Flagged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-pretty">{comment.content}</p>
                        
                        <div className="pt-2">
                          <ReactionBar targetId={comment.id} targetType="comment" userId={currentUser.id} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
