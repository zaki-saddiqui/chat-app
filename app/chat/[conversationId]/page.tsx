"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatWindow } from "@/components/chat-window"

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string
  const [recipientData, setRecipientData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConversation = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      try {
        // Get conversation details
        const { data: conversation } = await supabase
          .from("conversations")
          .select("user1_id, user2_id")
          .eq("id", conversationId)
          .single()

        if (!conversation) {
          router.push("/chat")
          return
        }

        const recipientId = conversation.user1_id === currentUser.id ? conversation.user2_id : conversation.user1_id

        // Get recipient data
        const { data: recipient } = await supabase
          .from("users")
          .select("id, display_name, profile_picture_url")
          .eq("id", recipientId)
          .single()

        setRecipientData({
          id: recipientId,
          ...recipient,
        })
      } catch (error) {
        console.error("Error loading conversation:", error)
        router.push("/chat")
      } finally {
        setIsLoading(false)
      }
    }

    loadConversation()
  }, [conversationId, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-1/4 max-w-xs border-r border-border">
          <ChatSidebar />
        </div>
        <div className="flex-1 flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full gap-0">
      <div className="w-1/4 max-w-xs border-r border-border">
        <ChatSidebar />
      </div>
      {recipientData && (
        <div className="flex-1">
          <ChatWindow
            conversationId={conversationId}
            recipientId={recipientData.id}
            recipientName={recipientData.display_name}
            recipientAvatar={recipientData.profile_picture_url}
          />
        </div>
      )}
    </div>
  )
}
