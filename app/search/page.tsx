import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { SearchInterface } from "@/components/search-interface"
import { redirect } from 'next/navigation'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    subject?: string
    board?: string
    sort?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const query = params.q || ""
  const subject = params.subject || ""
  const board = params.board || ""
  const sort = params.sort || "recent"

  const supabase = await createClient()

  // Build query
  let dbQuery = supabase
    .from("homework_posts")
    .select(`
      *,
      users:user_id (
        id,
        full_name,
        original_name,
        avatar_url,
        email
      ),
      communities:community_id (
        id,
        name,
        display_name
      ),
      comments (count)
    `)

  // Apply filters
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  }

  if (subject) {
    dbQuery = dbQuery.eq("subject", subject)
  }

  if (board) {
    dbQuery = dbQuery.eq("community_id", board)
  }

  // Apply sorting
  if (sort === "recent") {
    dbQuery = dbQuery.order("created_at", { ascending: false })
  } else if (sort === "oldest") {
    dbQuery = dbQuery.order("created_at", { ascending: true })
  } else if (sort === "popular") {
    // Sort by comment count - this requires a more complex query
    dbQuery = dbQuery.order("created_at", { ascending: false })
  }

  const { data: posts } = await dbQuery

  // Fetch member roles
  const postsWithRoles = await Promise.all(
    (posts || []).map(async (post) => {
      if (post.community_id && post.user_id) {
        const { data: memberData } = await supabase
          .from("community_members")
          .select("role")
          .match({ community_id: post.community_id, user_id: post.user_id })
          .single()

        return {
          ...post,
          users: {
            ...post.users,
            memberRole: memberData?.role || null,
          },
        }
      }
      return post
    }),
  )

  // Sort by popular (comment count) if needed
  let sortedPosts = postsWithRoles
  if (sort === "popular") {
    sortedPosts = postsWithRoles.sort((a, b) => {
      const aCount = a.comments?.[0]?.count || 0
      const bCount = b.comments?.[0]?.count || 0
      return bCount - aCount
    })
  }

  // Fetch communities for filter
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, display_name")
    .order("display_name", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <SearchInterface
          initialPosts={sortedPosts || []}
          communities={communities || []}
          currentUser={user}
          initialQuery={query}
          initialSubject={subject}
          initialBoard={board}
          initialSort={sort}
        />
      </main>
    </div>
  )
}
