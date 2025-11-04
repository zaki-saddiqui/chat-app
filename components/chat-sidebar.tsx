"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChatItem } from "./chat-item"
import { NewChatModal } from "./new-chat-modal"
import { Button } from "@/components/ui/button"
import { Plus, Settings } from "lucide-react"
import Link from "next/link"

interface ChatListItem {
  conversationId: string
  userId: string
  username: string
  displayName: string
  profilePicture?: string
  lastMessage?: string
  lastMessageTime?: string
}

export function ChatSidebar() {
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: conversations } = await supabase
        .from("conversations")
        .select(`
          id,
          user1_id,
          user2_id,
          messages (
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (!conversations) return

      const chatList: ChatListItem[] = []

      for (const conv of conversations) {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

        const { data: otherUser } = await supabase
          .from("users")
          .select("username, display_name, profile_picture_url")
          .eq("id", otherUserId)
          .single()

        const lastMsg = conv.messages?.[0]

        chatList.push({
          conversationId: conv.id,
          userId: otherUserId,
          username: otherUser?.username || "Unknown",
          displayName: otherUser?.display_name || "Unknown",
          profilePicture: otherUser?.profile_picture_url,
          lastMessage: lastMsg?.content?.substring(0, 40),
          lastMessageTime: lastMsg?.created_at,
        })
      }

      setChats(chatList)
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link href="/chat/profile">
          <Button size="icon" variant="ghost" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start a new conversation</p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatItem
              key={chat.conversationId}
              chat={chat}
              isSelected={selectedChatId === chat.conversationId}
              onSelect={setSelectedChatId}
            />
          ))
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button onClick={() => setIsNewChatOpen(true)} className="w-full rounded-full h-12 gap-2">
          <Plus className="w-5 h-5" />
          New Chat
        </Button>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && <NewChatModal onClose={() => setIsNewChatOpen(false)} onChatCreated={fetchChats} />}
    </div>
  )
}
