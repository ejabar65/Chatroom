"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HomeworkFeed } from "@/components/homework-feed"
import { Badge } from "@/components/ui/badge"
import { Search, X } from 'lucide-react'

interface SearchInterfaceProps {
  initialPosts: any[]
  communities: Array<{ id: string; name: string; display_name: string }>
  currentUser: { id: string; is_admin: boolean }
  initialQuery: string
  initialSubject: string
  initialBoard: string
  initialSort: string
}

const SUBJECTS = [
  "Math",
  "Science",
  "English",
  "History",
  "Foreign Language",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Curtis",
  "Cross",
  "Whitehead",
  "Gurrero",
  "Mendoza",
  "Kaminski",
  "Cole",
  "Hodgeson",
  "Thompson",
  "Juco",
  "McDaniel",
  "Vanny",
  "Sherman",
  "Mathis",
  "Reyaz",
  "Shumm",
  "Barnett",
  "Rose",
  "KING CHAPMAN",
  "Other",
]

export function SearchInterface({
  initialPosts,
  communities,
  currentUser,
  initialQuery,
  initialSubject,
  initialBoard,
  initialSort,
}: SearchInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [subject, setSubject] = useState(initialSubject)
  const [board, setBoard] = useState(initialBoard)
  const [sort, setSort] = useState(initialSort)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (subject) params.set("subject", subject)
    if (board) params.set("board", board)
    if (sort) params.set("sort", sort)

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery("")
    setSubject("")
    setBoard("")
    setSort("recent")
    router.push("/search")
  }

  const hasActiveFilters = query || subject || board || sort !== "recent"

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Search Homework Posts</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Board</label>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger>
                    <SelectValue placeholder="All boards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All boards</SelectItem>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="popular">Most Responses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {query && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{query}"
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setQuery("")
                        handleSearch()
                      }}
                    />
                  </Badge>
                )}
                {subject && (
                  <Badge variant="secondary" className="gap-1">
                    Subject: {subject}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setSubject("")
                        handleSearch()
                      }}
                    />
                  </Badge>
                )}
                {board && (
                  <Badge variant="secondary" className="gap-1">
                    Board: {communities.find((c) => c.id === board)?.display_name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setBoard("")
                        handleSearch()
                      }}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {initialPosts.length} {initialPosts.length === 1 ? "result" : "results"} found
          </h2>
        </div>

        {initialPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No posts found matching your search criteria. Try adjusting your filters.
            </p>
          </Card>
        ) : (
          <HomeworkFeed initialPosts={initialPosts} currentUser={currentUser} />
        )}
      </div>
    </div>
  )
}
