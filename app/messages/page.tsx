import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getConversations } from '@/lib/actions/direct-messages'
import { MessagesInterface } from '@/components/messages-interface'

export default async function MessagesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const conversations = await getConversations()

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <MessagesInterface 
        initialConversations={conversations} 
        currentUserId={user.id}
      />
    </div>
  )
}
