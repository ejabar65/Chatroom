'use server'

import { createServerClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

export async function autoTagPost(postId: string) {
  const supabase = await createServerClient()
  
  // Fetch post content
  const { data: post, error: postError } = await supabase
    .from('homework_posts')
    .select('title, description, subject')
    .eq('id', postId)
    .single()

  if (postError || !post) return

  try {
    // Generate tags using AI
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: `Analyze this homework post and generate 3-5 relevant tags. Post: "${post.title}. ${post.description}". Subject: ${post.subject || 'Unknown'}. Return ONLY a comma-separated list of tags, no other text.`,
      maxTokens: 100
    })

    const tags = text.split(',').map(t => t.trim()).filter(t => t.length > 0)

    // Save tags to database
    for (const tag of tags) {
      await supabase
        .from('post_auto_tags')
        .insert({
          post_id: postId,
          tag,
          confidence: 0.85
        })
        .onConflict('post_id,tag')
        .ignore()
    }

    return tags
  } catch (error) {
    console.error('[v0] Auto-tag error:', error)
    return []
  }
}

export async function summarizePost(postContent: string) {
  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: `Summarize this homework post in 1-2 sentences: "${postContent}"`,
      maxTokens: 150
    })

    return text
  } catch (error) {
    console.error('[v0] Summarize error:', error)
    return null
  }
}

export async function suggestRelatedPosts(postId: string) {
  const supabase = await createServerClient()
  
  // Get post tags
  const { data: tags } = await supabase
    .from('post_auto_tags')
    .select('tag')
    .eq('post_id', postId)

  if (!tags || tags.length === 0) return []

  // Find posts with similar tags
  const tagList = tags.map(t => t.tag)
  
  const { data: relatedPosts, error } = await supabase
    .from('post_auto_tags')
    .select(`
      post_id,
      homework_posts!inner(
        id, title, subject, created_at,
        users!inner(id, full_name, avatar_url)
      )
    `)
    .in('tag', tagList)
    .neq('post_id', postId)
    .limit(5)

  if (error) return []

  // Deduplicate and return
  const uniquePosts = Array.from(
    new Map(relatedPosts.map(item => [item.post_id, item])).values()
  )

  return uniquePosts
}
