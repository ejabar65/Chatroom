"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { banUser, unbanUser, toggleAdminStatus, toggleThrottleStatus, shadowbanUser, unshadowbanUser } from "@/lib/actions/users"
import { updateReportStatus } from "@/lib/actions/reports"
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

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  is_admin: boolean
  is_banned: boolean
  is_shadowbanned: boolean
  is_throttled: boolean
  ban_reason: string | null
  shadowban_reason: string | null
  banned_at: string | null
  shadowbanned_at: string | null
}

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  reporter: {
    id: string
    full_name: string | null
    email: string
  }
  reported_user?: {
    id: string
    full_name: string | null
    email: string
  } | null
  reported_post?: {
    id: string
    title: string
  } | null
  reported_comment?: {
    id: string
    content: string
  } | null
}

interface AdminDashboardProps {
  posts: Post[]
  comments: Comment[]
  users: User[]
  reports: Report[]
  stats: {
    totalPosts: number
    flaggedPosts: number
    totalComments: number
    flaggedComments: number
    totalUsers: number
    pendingReports: number
  }
}

export function AdminDashboard({ posts, comments, users, reports, stats }: AdminDashboardProps) {
  const router = useRouter()
  const [flagReason, setFlagReason] = useState<{ [key: string]: string }>({})
  const [banReason, setBanReason] = useState<{ [key: string]: string }>({})
  const [shadowbanReason, setShadowbanReason] = useState<{ [key: string]: string }>({})

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

  const handleBanUser = async (userId: string) => {
    const reason = banReason[userId] || "Violation of platform rules"
    if (!confirm(`Are you sure you want to ban this user?\nReason: ${reason}`)) return
    const adminKey = getAdminKey()
    const result = await banUser(userId, reason, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to unban this user?")) return
    const adminKey = getAdminKey()
    const result = await unbanUser(userId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleToggleAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to toggle admin status for this user?")) return
    const adminKey = getAdminKey()
    const result = await toggleAdminStatus(userId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleToggleThrottle = async (userId: string) => {
    if (!confirm("Are you sure you want to toggle throttle status for this user?")) return
    const adminKey = getAdminKey()
    const result = await toggleThrottleStatus(userId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleShadowbanUser = async (userId: string) => {
    const reason = shadowbanReason[userId] || "Suspicious activity"
    if (!confirm(`Are you sure you want to shadowban this user?\nReason: ${reason}`)) return
    const adminKey = getAdminKey()
    const result = await shadowbanUser(userId, reason, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUnshadowbanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove shadowban from this user?")) return
    const adminKey = getAdminKey()
    const result = await unshadowbanUser(userId, adminKey)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleReportAction = async (reportId: string, status: string) => {
    const result = await updateReportStatus(reportId, status)
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertIcon className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.pendingReports}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Content ({stats.flaggedPosts + stats.flaggedComments})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <CheckIcon className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports</h3>
              <p className="text-muted-foreground">All clear! No reports to review</p>
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-sm">
                          Reported by: {report.reporter.full_name || report.reporter.email}
                        </p>
                        <Badge
                          variant={
                            report.status === "pending"
                              ? "default"
                              : report.status === "resolved"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Report Reason:</p>
                    <p className="text-sm">{report.reason}</p>
                  </div>

                  {report.reported_user && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Reported User:</p>
                      <Link href={`/profile/${report.reported_user.id}`} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                        {report.reported_user.full_name || report.reported_user.email}
                      </Link>
                    </div>
                  )}

                  {report.reported_post && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">Reported Post:</p>
                      <Link href={`/post/${report.reported_post.id}`} className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
                        {report.reported_post.title}
                      </Link>
                    </div>
                  )}

                  {report.reported_comment && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">Reported Comment:</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 line-clamp-2">
                        {report.reported_comment.content}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  {report.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleReportAction(report.id, "reviewed")}>
                        Mark Reviewed
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleReportAction(report.id, "resolved")}>
                        Resolve
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleReportAction(report.id, "dismissed")}>
                        Dismiss
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

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
                      <Link href={`/profile/${post.users.id}`}>
                        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={post.users.avatar_url || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
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
                      <Link href={`/profile/${comment.users.id}`}>
                        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={comment.users.avatar_url || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
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
                                <Link href={`/profile/${post.users.id}`}>
                                  <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={post.users.avatar_url || undefined} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                                  </Avatar>
                                </Link>
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
                                <Link href={`/profile/${comment.users.id}`}>
                                  <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={comment.users.avatar_url || undefined} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                                  </Avatar>
                                </Link>
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

        <TabsContent value="users" className="space-y-4">
          {users.map((user) => {
            const initials =
              user.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || user.email[0].toUpperCase()

            return (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${user.id}`}>
                        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <p className="font-medium text-sm">{user.full_name || "Student"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.is_admin && (
                        <Badge variant="default" className="bg-yellow-600">
                          <ShieldIcon className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.is_banned && (
                        <Badge variant="destructive">
                          <AlertIcon className="w-3 h-3 mr-1" />
                          Banned
                        </Badge>
                      )}
                      {user.is_shadowbanned && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                          Shadowbanned
                        </Badge>
                      )}
                      {user.is_throttled && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          Throttled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.is_banned && user.ban_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive">Ban Reason:</p>
                      <p className="text-sm text-destructive/80">{user.ban_reason}</p>
                      {user.banned_at && (
                        <p className="text-xs text-destructive/60 mt-1">
                          Banned {formatDistanceToNow(new Date(user.banned_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                  {user.is_shadowbanned && user.shadowban_reason && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Shadowban Reason:</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">{user.shadowban_reason}</p>
                      {user.shadowbanned_at && (
                        <p className="text-xs text-purple-500 dark:text-purple-500 mt-1">
                          Shadowbanned {formatDistanceToNow(new Date(user.shadowbanned_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {!user.is_banned ? (
                    <>
                      <Textarea
                        placeholder="Ban reason..."
                        value={banReason[user.id] || ""}
                        onChange={(e) => setBanReason({ ...banReason, [user.id]: e.target.value })}
                        className="max-w-xs min-h-[60px]"
                      />
                      <Button variant="destructive" size="sm" onClick={() => handleBanUser(user.id)}>
                        <AlertIcon className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Unban User
                    </Button>
                  )}
                  {!user.is_shadowbanned ? (
                    <>
                      <Input
                        placeholder="Shadowban reason..."
                        value={shadowbanReason[user.id] || ""}
                        onChange={(e) => setShadowbanReason({ ...shadowbanReason, [user.id]: e.target.value })}
                        className="max-w-xs"
                      />
                      <Button variant="secondary" size="sm" onClick={() => handleShadowbanUser(user.id)}>
                        Shadowban
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUnshadowbanUser(user.id)}>
                      Remove Shadowban
                    </Button>
                  )}
                  <Button
                    variant={user.is_admin ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleAdmin(user.id)}
                  >
                    <ShieldIcon className="w-4 h-4 mr-2" />
                    {user.is_admin ? "Remove Admin" : "Make Admin"}
                  </Button>
                  <Button
                    variant={user.is_throttled ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleThrottle(user.id)}
                  >
                    {user.is_throttled ? "Unthrottle" : "Throttle"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
