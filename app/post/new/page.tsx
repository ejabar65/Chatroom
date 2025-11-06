import { getCurrentUser } from "@/lib/actions/auth"
import { PostForm } from "@/components/post-form"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"

export default async function NewPostPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Ask for Help</h1>
          <p className="text-muted-foreground">Upload a photo of your homework and describe what you need help with</p>
        </div>
        <PostForm userId={user.id} />
      </main>
    </div>
  )
}
