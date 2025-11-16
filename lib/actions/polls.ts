"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { applyThrottle } from "@/lib/throttle"

export async function createPoll(
  postId: string,
  question: string,
  options: string[],
  expiresInHours?: number,
  allowMultiple: boolean = false
) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    if (options.length < 2) {
      return { success: false, error: "Poll must have at least 2 options" }
    }

    if (options.length > 10) {
      return { success: false, error: "Poll cannot have more than 10 options" }
    }

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        post_id: postId,
        question: question.trim(),
        expires_at: expiresAt,
        allow_multiple: allowMultiple,
      })
      .select()
      .single()

    if (pollError) {
      return { success: false, error: "Failed to create poll" }
    }

    // Create poll options
    const optionsToInsert = options.map((opt) => ({
      poll_id: poll.id,
      option_text: opt.trim(),
    }))

    const { error: optionsError } = await supabase.from("poll_options").insert(optionsToInsert)

    if (optionsError) {
      await supabase.from("polls").delete().eq("id", poll.id)
      return { success: false, error: "Failed to create poll options" }
    }

    // Update post to mark it has a poll
    await supabase.from("homework_posts").update({ has_poll: true }).eq("id", postId)

    revalidatePath(`/post/${postId}`)
    return { success: true, data: poll }
  } catch (error) {
    console.error("[v0] Create poll error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function votePoll(pollId: string, optionId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if poll has expired
    const { data: poll } = await supabase.from("polls").select("expires_at, allow_multiple").eq("id", pollId).single()

    if (poll?.expires_at && new Date(poll.expires_at) < new Date()) {
      return { success: false, error: "This poll has expired" }
    }

    // Check if user already voted (if not allowing multiple)
    if (!poll?.allow_multiple) {
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("id")
        .match({ poll_id: pollId, user_id: user.id })
        .single()

      if (existingVote) {
        return { success: false, error: "You have already voted on this poll" }
      }
    }

    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "You have already voted for this option" }
      }
      return { success: false, error: "Failed to vote" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Vote poll error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function removePollVote(pollId: string, optionId: string) {
  await applyThrottle()

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("poll_votes")
      .delete()
      .match({ poll_id: pollId, option_id: optionId, user_id: user.id })

    if (error) {
      return { success: false, error: "Failed to remove vote" }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Remove vote error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getPollResults(pollId: string) {
  try {
    const supabase = await createClient()

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (
          id,
          option_text,
          vote_count
        )
      `)
      .eq("id", pollId)
      .single()

    if (pollError) {
      return { success: false, error: "Failed to fetch poll results" }
    }

    // Get user's votes
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userVotes: string[] = []
    if (user) {
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("option_id")
        .match({ poll_id: pollId, user_id: user.id })

      userVotes = votes?.map((v) => v.option_id) || []
    }

    return { success: true, data: poll, userVotes }
  } catch (error) {
    console.error("[v0] Get poll results error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
