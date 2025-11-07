"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertIcon,
  UsersIcon,
  FileIcon,
  MessageIcon,
  FlagIcon,
  TrashIcon,
  ShieldIcon,
  CheckIcon,
} from "@/components/icons"
import { formatDistanceToNow } from "date-fns"
import { flagPost, unflagPost, deletePost } from "@/lib/actions/posts"
import { flagComment, unflagComment, deleteComment } from "@/lib/actions/comments"
import Link from "next/link"

interface Post {
  id: string
  title: string
  description: string | null
  image_url: string
  subject: string | null
  is_flagged: boolean
  flag_reason: string | null
  created_at: string
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
  comments: { count: number }[]
}

interface Comment {
  id: string
  content: string
  is_flagged: boolean
  created_at: string
  users: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
  homework_posts: {
    id: string
    title: string
  }
}

interface AdminDashboardProps {
  posts: Post[]
  comments: Comment[]
  stats: {
    totalPosts: number
    flaggedPosts: number
    totalComments: number
    flaggedComments: number
    totalUsers: number
  }
}

export function AdminDashboard({ posts, comments, stats }: AdminDashboardProps) {
  const router = useRouter()
  const [flagReason, setFlagReason] = useState<{ [key: string]: string }>({})

  const getAdminKey = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminKey") || ""
    }
    return ""
  }

  const handleFlagPost = async (postId: string) => {
    const reason = flagReason[postId] || "Inappropriate content"
    const adminKey = getAdminKey()
    const result = await flagPost(postId, reason, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUnflagPost = async (postId: string) => {
    const adminKey = getAdminKey()
    const result = await unflagPost(postId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    const adminKey = getAdminKey()
    const result = await deletePost(postId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleFlagComment = async (commentId: string) => {
    const adminKey = getAdminKey()
    const result = await flagComment(commentId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUnflagComment = async (commentId: string) => {
    const adminKey = getAdminKey()
    const result = await unflagComment(commentId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return
    const adminKey = getAdminKey()
    const result = await deleteComment(commentId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
          <ShieldIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage content and monitor platform activity</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold">{stats.totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileIcon className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalPosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertIcon className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">{stats.flaggedPosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageIcon className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.totalComments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FlagIcon className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{stats.flaggedComments}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Content ({stats.flaggedPosts + stats.flaggedComments})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.map((post) => {
            const initials =
              post.users.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || post.users.email[0].toUpperCase()

            return (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.users.avatar_url || undefined} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{post.users.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{post.users.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.subject && <Badge variant="secondary">{post.subject}</Badge>}
                      {post.is_flagged && (
                        <Badge variant="destructive">
                          <AlertIcon className="w-3 h-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <h3 className="font-semibold text-balance">{post.title}</h3>
                  {post.description && <p className="text-sm text-muted-foreground text-pretty">{post.description}</p>}
                  {post.is_flagged && post.flag_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive">Flag Reason:</p>
                      <p className="text-sm text-destructive/80">{post.flag_reason}</p>
                    </div>
                  )}
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/post/${post.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  {!post.is_flagged ? (
                    <>
                      <Input
                        placeholder="Flag reason..."
                        value={flagReason[post.id] || ""}
                        onChange={(e) => setFlagReason({ ...flagReason, [post.id]: e.target.value })}
                        className="max-w-xs"
                        size={1}
                      />
                      <Button variant="outline" size="sm" onClick={() => handleFlagPost(post.id)}>
                        <FlagIcon className="w-4 h-4 mr-2" />
                        Flag
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUnflagPost(post.id)}>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Unflag
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.id)}>
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {comments.map((comment) => {
            const initials =
              comment.users.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || comment.users.email[0].toUpperCase()

            return (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={comment.users.avatar_url || undefined} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{comment.users.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{comment.users.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {comment.is_flagged && (
                      <Badge variant="destructive">
                        <AlertIcon className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    On post:{" "}
                    <Link
                      href={`/post/${comment.homework_posts.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {comment.homework_posts.title}
                    </Link>
                  </p>
                  <p className="text-sm text-pretty">{comment.content}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/post/${comment.homework_posts.id}`}>
                    <Button variant="outline" size="sm">
                      View Post
                    </Button>
                  </Link>
                  {!comment.is_flagged ? (
                    <Button variant="outline" size="sm" onClick={() => handleFlagComment(comment.id)}>
                      <FlagIcon className="w-4 h-4 mr-2" />
                      Flag
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUnflagComment(comment.id)}>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Unflag
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <div className="space-y-6">
            {stats.flaggedPosts > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Flagged Posts</h3>
                <div className="space-y-4">
                  {posts
                    .filter((p) => p.is_flagged)
                    .map((post) => {
                      const initials =
                        post.users.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || post.users.email[0].toUpperCase()

                      return (
                        <Card key={post.id} className="border-destructive/50">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={post.users.avatar_url || undefined} />
                                  <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{post.users.full_name || "Student"}</p>
                                  <p className="text-xs text-muted-foreground">{post.users.email}</p>
                                </div>
                              </div>
                              <Badge variant="destructive">
                                <AlertIcon className="w-3 h-3 mr-1" />
                                Flagged Post
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <h3 className="font-semibold">{post.title}</h3>
                            {post.flag_reason && (
                              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm font-medium text-destructive">Reason:</p>
                                <p className="text-sm text-destructive/80">{post.flag_reason}</p>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Link href={`/post/${post.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => handleUnflagPost(post.id)}>
                              <CheckIcon className="w-4 h-4 mr-2" />
                              Unflag
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.id)}>
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}

            {stats.flaggedComments > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Flagged Comments</h3>
                <div className="space-y-4">
                  {comments
                    .filter((c) => c.is_flagged)
                    .map((comment) => {
                      const initials =
                        comment.users.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || comment.users.email[0].toUpperCase()

                      return (
                        <Card key={comment.id} className="border-destructive/50">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={comment.users.avatar_url || undefined} />
                                  <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{comment.users.full_name || "Student"}</p>
                                  <p className="text-xs text-muted-foreground">{comment.users.email}</p>
                                </div>
                              </div>
                              <Badge variant="destructive">
                                <AlertIcon className="w-3 h-3 mr-1" />
                                Flagged Comment
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{comment.content}</p>
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Link href={`/post/${comment.homework_posts.id}`}>
                              <Button variant="outline" size="sm">
                                View Post
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => handleUnflagComment(comment.id)}>
                              <CheckIcon className="w-4 h-4 mr-2" />
                              Unflag
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}

            {stats.flaggedPosts === 0 && stats.flaggedComments === 0 && (
              <div className="text-center py-12">
                <CheckIcon className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground">No flagged content to review</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
