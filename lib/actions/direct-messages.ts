'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applyUserThrottle } from '@/lib/throttle'

export async function getConversations() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('dm_conversations')
    .select(`
      *,
      user1:user1_id(id, full_name, avatar_url),
      user2:user2_id(id, full_name, avatar_url)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getMessages(otherUserId: string) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:sender_id(id, full_name, avatar_url),
      recipient:recipient_id(id, full_name, avatar_url)
    `)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) throw error
  
  // Mark messages as read
  await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('sender_id', otherUserId)
    .eq('is_read', false)

  return data || []
}

export async function sendMessage(recipientId: string, content: string) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await applyUserThrottle(user.id)

  // Create message
  const { data: message, error: messageError } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content
    })
    .select()
    .single()

  if (messageError) throw messageError

  // Update or create conversation
  const [userId1, userId2] = [user.id, recipientId].sort()
  
  const { error: convError } = await supabase
    .from('dm_conversations')
    .upsert({
      user1_id: userId1,
      user2_id: userId2,
      last_message_at: new Date().toISOString(),
      last_message_content: content.substring(0, 100)
    }, {
      onConflict: 'user1_id,user2_id'
    })

  if (convError) throw convError

  revalidatePath('/messages')
  return message
}

export async function deleteMessage(messageId: string) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('direct_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) throw error
  revalidatePath('/messages')
}
