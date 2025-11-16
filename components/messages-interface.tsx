'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMessages, sendMessage } from '@/lib/actions/direct-messages'
import { SendIcon } from '@/components/icons'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Conversation {
  id: string
  user1: { id: string; full_name: string; avatar_url: string | null }
  user2: { id: string; full_name: string; avatar_url: string | null }
  last_message_at: string
  last_message_content: string | null
}

interface Message {
  id: string
  content: string
  created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null }
  recipient: { id: string; full_name: string; avatar_url: string | null }
}

export function MessagesInterface({ 
  initialConversations, 
  currentUserId 
}: { 
  initialConversations: Conversation[]
  currentUserId: string
}) {
  const [conversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const otherUser = selectedConversation 
    ? conversations.find(c => c.id === selectedConversation)?.user1.id === currentUserId
      ? conversations.find(c => c.id === selectedConversation)?.user2
      : conversations.find(c => c.id === selectedConversation)?.user1
    : null

  useEffect(() => {
    if (selectedConversation && otherUser) {
      loadMessages(otherUser.id)
    }
  }, [selectedConversation])

  const loadMessages = async (userId: string) => {
    setLoading(true)
    const msgs = await getMessages(userId)
    setMessages(msgs)
    setLoading(false)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !otherUser) return

    await sendMessage(otherUser.id, newMessage)
    setNewMessage('')
    loadMessages(otherUser.id)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations list */}
      <Card className="p-4 overflow-hidden flex flex-col">
        <h2 className="font-semibold mb-4">Conversations</h2>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {conversations.map(conv => {
              const other = conv.user1.id === currentUserId ? conv.user2 : conv.user1
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                    selectedConversation === conv.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={other.avatar_url || undefined} />
                      <AvatarFallback>{other.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{other.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message_content}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Messages area */}
      <Card className="md:col-span-2 p-4 flex flex-col">
        {selectedConversation && otherUser ? (
          <>
            <div className="flex items-center gap-3 pb-4 border-b mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback>{otherUser.full_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{otherUser.full_name}</p>
                <Link href={`/profile/${otherUser.id}`} className="text-xs text-primary hover:underline">
                  View profile
                </Link>
              </div>
            </div>

            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {messages.map(msg => {
                  const isSender = msg.sender.id === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!newMessage.trim()}>
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </Card>
    </div>
  )
}
