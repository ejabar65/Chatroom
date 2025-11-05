import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { PostDetail } from "@/components/post-detail"
import { notFound, redirect } from "next/navigation"

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch post with user info and comments
  const { data: post, error } = await supabase
    .from("homework_posts")
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        avatar_url,
        email
      ),
      comments (
        *,
        users:user_id (
          id,
          full_name,
          avatar_url,
          email
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <PostDetail post={post} currentUser={user} />
      </main>
    </div>
  )
}
