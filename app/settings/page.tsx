import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { SettingsForm } from "@/components/settings-form"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch user preferences
  const { data: preferences } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <SettingsForm user={user} preferences={preferences} />
      </main>
    </div>
  )
}
