"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { votePoll, removePollVote, getPollResults } from "@/lib/actions/polls"
import { CheckCircleIcon } from "@/components/icons"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from 'next/navigation'

interface PollDisplayProps {
  pollId: string
  userId: string
}

export function PollDisplay({ pollId, userId }: PollDisplayProps) {
  const router = useRouter()
  const [poll, setPoll] = useState<any>(null)
  const [userVotes, setUserVotes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    loadPoll()
  }, [pollId])

  const loadPoll = async () => {
    setIsLoading(true)
    const result = await getPollResults(pollId)
    if (result.success && result.data) {
      setPoll(result.data)
      setUserVotes(result.userVotes || [])
    }
    setIsLoading(false)
  }

  const handleVote = async (optionId: string) => {
    if (userVotes.includes(optionId)) {
      setIsVoting(true)
      const result = await removePollVote(pollId, optionId)
      if (result.success) {
        await loadPoll()
        router.refresh()
      } else {
        alert(result.error)
      }
      setIsVoting(false)
    } else {
      setIsVoting(true)
      const result = await votePoll(pollId, optionId)
      if (result.success) {
        await loadPoll()
        router.refresh()
      } else {
        alert(result.error)
      }
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading poll...</p>
        </CardContent>
      </Card>
    )
  }

  if (!poll) {
    return null
  }

  const totalVotes = poll.poll_options?.reduce((sum: number, opt: any) => sum + opt.vote_count, 0) || 0
  const hasExpired = poll.expires_at && new Date(poll.expires_at) < new Date()
  const hasVoted = userVotes.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{poll.question}</CardTitle>
          <div className="flex gap-2">
            {hasExpired && <Badge variant="secondary">Ended</Badge>}
            {poll.allow_multiple && <Badge variant="outline">Multiple Choice</Badge>}
          </div>
        </div>
        {poll.expires_at && !hasExpired && (
          <p className="text-sm text-muted-foreground">
            Ends {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.poll_options?.map((option: any) => {
          const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
          const isSelected = userVotes.includes(option.id)

          return (
            <div key={option.id} className="space-y-2">
              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-between h-auto py-3"
                onClick={() => handleVote(option.id)}
                disabled={isVoting || hasExpired}
              >
                <span className="flex items-center gap-2">
                  {isSelected && <CheckCircleIcon className="w-4 h-4" />}
                  {option.option_text}
                </span>
                {hasVoted && <span className="font-semibold">{option.vote_count} votes</span>}
              </Button>
              {hasVoted && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage}%</span>
                    <span>{option.vote_count} votes</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )}
            </div>
          )
        })}

        <p className="text-sm text-muted-foreground text-center pt-2">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} total
        </p>
      </CardContent>
    </Card>
  )
}
