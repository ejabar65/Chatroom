export type ReactionType = "like" | "helpful" | "thanks" | "smart" | "fire" | "laugh"

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  helpful: "✨",
  thanks: "🙏",
  smart: "🧠",
  fire: "🔥",
  laugh: "😂",
}

export interface Reaction {
  id: string
  user_id: string
  post_id?: string | null
  comment_id?: string | null
  reaction_type: ReactionType
  created_at: string
}

export interface ReactionCount {
  reaction_type: ReactionType
  count: number
  user_reacted: boolean
}
