"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ImageIcon, FileIcon } from "lucide-react"

interface ChatWindowProps {
  conversationId: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  message_type: string
  file_url?: string
  created_at: string
}

export function ChatWindow({ conversationId, recipientId, recipientName, recipientAvatar }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load current user and messages
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      if (user) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        setMessages(data || [])
      }
      setIsLoading(false)
    }

    fetchData()
  }, [conversationId])

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time changes
    subscriptionRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("[v0] New message received via realtime:", payload.new)
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some((m) => m.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })
        },
      )
      .subscribe((status) => {
        console.log("[v0] Subscription status:", status)
      })

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [conversationId])

  // Load persisted draft from localStorage
  useEffect(() => {
    const draftKey = `chat-draft-${conversationId}`
    const draft = localStorage.getItem(draftKey)
    if (draft) {
      setNewMessage(draft)
    }
  }, [conversationId])

  // Save draft to localStorage
  const handleMessageChange = (text: string) => {
    setNewMessage(text)
    const draftKey = `chat-draft-${conversationId}`
    if (text.trim()) {
      localStorage.setItem(draftKey, text)
    } else {
      localStorage.removeItem(draftKey)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUserId,
      content: newMessage,
      message_type: "text",
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    const messageText = newMessage
    setNewMessage("")
    localStorage.removeItem(`chat-draft-${conversationId}`)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: recipientId,
          message_type: "text",
          content: messageText,
        })
        .select() // Added .select() to return the inserted message data

      if (error) throw error

      console.log("[v0] Message sent successfully:", data)

      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(messageText)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipientAvatar || "/placeholder.svg"} alt={recipientName} />
          <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground">{recipientName}</h2>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl ${
                msg.sender_id === currentUserId
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-muted-foreground rounded-bl-none"
              }`}
            >
              {msg.message_type === "text" ? (
                <p className="text-sm break-words">{msg.content}</p>
              ) : msg.message_type === "image" ? (
                <img src={msg.file_url || "/placeholder.svg"} alt="shared image" className="max-w-[200px] rounded-lg" />
              ) : (
                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                  {msg.content}
                </a>
              )}
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Button type="button" size="icon" variant="ghost" className="rounded-full cursor-pointer">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="rounded-full cursor-pointer">
            <FileIcon className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            className="rounded-full border-input h-10"
            disabled={!currentUserId}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || !currentUserId}
            className="rounded-full cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
