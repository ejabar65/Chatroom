import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { HomeworkFeed } from "@/components/homework-feed"
import { BookmarkIcon } from "@/components/icons"

export default async function BookmarksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  // Fetch bookmarked posts
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select(`
      post_id,
      homework_posts:post_id (
        id,
        title,
        description,
        image_url,
        subject,
        is_flagged,
        created_at,
        users:user_id (
          id,
          full_name,
          original_name,
          avatar_url,
          email,
          is_admin
        ),
        communities:community_id (
          id,
          name,
          display_name
        ),
        comments (count)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const posts = bookmarks
    ?.map((b: any) => b.homework_posts)
    .filter(Boolean) || []

  const currentUser = {
    id: user.id,
    is_admin: userProfile?.is_admin || false,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookmarkIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Saved Posts</h1>
        </div>
        <p className="text-muted-foreground">
          Posts you've bookmarked for later reference
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <BookmarkIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No saved posts yet</h2>
          <p className="text-muted-foreground">
            Bookmark posts to save them for later
          </p>
        </div>
      ) : (
        <HomeworkFeed initialPosts={posts} currentUser={currentUser} />
      )}
    </div>
  )
}
