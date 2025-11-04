"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "@/components/chat-sidebar"

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="flex h-screen w-full gap-0">
      <div className="w-1/4 max-w-xs border-r border-border">
        <ChatSidebar />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">
        <p>Select a chat to start messaging</p>
      </div>
    </div>
  )
}
