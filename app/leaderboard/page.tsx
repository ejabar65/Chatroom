import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TrophyIcon, CrownIcon } from "@/components/icons"
import Link from "next/link"
import { redirect } from 'next/navigation'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: leaderboard } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, karma_points, award_count, post_count")
    .order("karma_points", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            Karma Leaderboard
          </h1>
          <p className="text-muted-foreground">Top contributors in the community</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top 50 Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard?.map((member, index) => {
                const initials =
                  member.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"
                const isTopThree = index < 3

                return (
                  <Link key={member.id} href={`/profile/${member.id}`}>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-colors ${
                        isTopThree ? "bg-gradient-to-r from-yellow-500/10 to-transparent" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`text-2xl font-bold w-8 text-center ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <div className="relative">
                          <Avatar className={isTopThree ? "w-12 h-12 border-2 border-yellow-500" : ""}>
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <CrownIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium">{member.full_name || "Student"}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.post_count || 0} posts • {member.award_count || 0} awards
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={isTopThree ? "default" : "secondary"}
                        className={
                          isTopThree ? "bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-1" : ""
                        }
                      >
                        {member.karma_points || 0} karma
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
