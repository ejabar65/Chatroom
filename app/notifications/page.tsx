import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsList } from '@/components/notifications-list'

export default async function NotificationsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const notifications = await getNotifications()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <NotificationsList initialNotifications={notifications} />
    </div>
  )
}
