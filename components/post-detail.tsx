"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, SendIcon, TrashIcon, AlertTriangleIcon, CrownIcon, QuoteIcon, PinIcon, LockIconComponent, HistoryIcon } from "@/components/icons"
import { formatDistanceToNow } from "date-fns"
import { createComment } from "@/lib/actions/comments"
import { deletePost } from "@/lib/actions/posts"
import Link from "next/link"
import { ReactionBar } from "@/components/reaction-bar"
import { BookmarkButton } from "@/components/bookmark-button"
import { MarkdownContent } from "@/components/markdown-content"
import { PostAdminControls } from "@/components/post-admin-controls"

interface Comment {
  id: string
  content: string
  created_at: string
  is_flagged: boolean
  parent_comment_id?: string | null
  quoted_text?: string | null
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    is_admin: boolean
    original_name: string | null
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
  is_pinned?: boolean
  is_locked?: boolean
  lock_reason?: string | null
  flair_text?: string | null
  flair_color?: string | null
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    is_admin: boolean
    original_name: string | null
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
  const [quotingComment, setQuotingComment] = useState<Comment | null>(null)

  const initials =
    post.users.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || post.users.email[0].toUpperCase()

  const postAuthorDisplayName = post.users.full_name || "Student"
  const postAuthorHasCustomName = post.users.full_name && post.users.original_name && post.users.full_name !== post.users.original_name

  const buildCommentTree = (comments: Comment[]): { topLevel: Comment[]; childrenMap: Map<string, Comment[]> } => {
    const topLevel: Comment[] = []
    const childrenMap = new Map<string, Comment[]>()

    comments.forEach((comment) => {
      if (!comment.parent_comment_id) {
        topLevel.push(comment)
      } else {
        const siblings = childrenMap.get(comment.parent_comment_id) || []
        siblings.push(comment)
        childrenMap.set(comment.parent_comment_id, siblings)
      }
    })

    return { topLevel, childrenMap }
  }

  const { topLevel, childrenMap } = buildCommentTree(post.comments)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createComment(
        post.id, 
        comment.trim(),
        quotingComment?.id,
        quotingComment?.content
      )
      if (result.success) {
        setComment("")
        setQuotingComment(null)
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

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const commentInitials =
      comment.users.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || comment.users.email[0].toUpperCase()

    const commentAuthorDisplayName = comment.users.full_name || "Student"
    const commentAuthorHasCustomName = comment.users.full_name && comment.users.original_name && comment.users.full_name !== comment.users.original_name

    const children = childrenMap.get(comment.id) || []
    const maxDepth = 5
    const canNest = depth < maxDepth

    return (
      <div className={depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}>
        <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
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
                    ({comment.users.original_name})
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
              {comment.is_flagged && currentUser.is_admin && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </div>
            
            {comment.quoted_text && (
              <div className="p-2 bg-background/50 rounded border-l-2 border-primary mb-2">
                <p className="text-sm text-muted-foreground italic line-clamp-2">
                  {comment.quoted_text}
                </p>
              </div>
            )}
            
            <MarkdownContent content={comment.content} className="text-sm" />
            
            <div className="pt-2 flex items-center gap-2">
              <ReactionBar targetId={comment.id} targetType="comment" userId={currentUser.id} />
              {!post.is_locked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuotingComment(comment)}
                  className="h-8 px-2 text-xs"
                >
                  <QuoteIcon className="w-3 h-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          </div>
        </div>

        {canNest && children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((child) => (
                <CommentItem key={child.id} comment={child} depth={depth + 1} />
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>
        <div className="flex gap-2">
          <BookmarkButton postId={post.id} userId={currentUser.id} size="sm" />
          {currentUser.is_admin && (
            <PostAdminControls
              postId={post.id}
              isPinned={post.is_pinned || false}
              isLocked={post.is_locked || false}
              lockReason={post.lock_reason}
              flairText={post.flair_text}
              flairColor={post.flair_color}
            />
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {post.is_pinned && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <PinIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">This post is pinned</span>
        </div>
      )}

      {post.is_locked && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <LockIconComponent className="w-5 h-5 text-orange-600 dark:text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">This post is locked</span>
          </div>
          {post.lock_reason && (
            <p className="text-sm text-orange-600/80 dark:text-orange-400/80 ml-7">
              Reason: {post.lock_reason}
            </p>
          )}
        </div>
      )}

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
              <div>
                <p className={`font-medium ${isAdmin(post.users) ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                  {postAuthorDisplayName}
                  {postAuthorHasCustomName && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({post.users.original_name})
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {post.flair_text && (
                <Badge
                  className="text-xs"
                  style={{ backgroundColor: post.flair_color || "#3b82f6", color: "#fff" }}
                >
                  {post.flair_text}
                </Badge>
              )}
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
          {post.description && <MarkdownContent content={post.description} />}
          <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
            <img src={post.image_url || "/placeholder.svg"} alt={post.title} className="w-full h-auto" />
          </div>
          
          <div className="pt-2">
            <ReactionBar targetId={post.id} targetType="post" userId={currentUser.id} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Responses ({post.comments.length})</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {!post.is_locked ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              {quotingComment && (
                <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Replying to {quotingComment.users.full_name || "Student"}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuotingComment(null)}
                      className="h-6 px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground italic line-clamp-2">
                    {quotingComment.content}
                  </p>
                </div>
              )}
              <Textarea
                placeholder="Share your help or solution... (Markdown supported)"
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
                  {quotingComment ? "Post Reply" : "Post Response"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-center">
              <LockIconComponent className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Comments are disabled for this post</p>
            </div>
          )}

          {post.comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No responses yet. Be the first to help!</p>
          ) : (
            <div className="space-y-4">
              {topLevel
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((comment) => (
                  <CommentItem key={comment.id} comment={comment} depth={0} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
