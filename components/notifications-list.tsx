'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from '@/lib/actions/notifications'
import { XIcon, CheckIcon } from '@/components/icons'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  link: string | null
  is_read: boolean
  created_at: string
  related_user?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function NotificationsList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <Button onClick={handleMarkAllRead} variant="outline" size="sm">
            <CheckIcon className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`p-4 ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
            >
              <div className="flex gap-4">
                {notification.related_user && (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.related_user.avatar_url || undefined} />
                    <AvatarFallback>
                      {notification.related_user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      {notification.content && (
                        <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          onClick={() => handleMarkRead(notification.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {notification.link && (
                    <Link href={notification.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
