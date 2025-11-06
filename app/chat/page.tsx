"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "@/components/chat-sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function ChatPage() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-1/4 md:max-w-xs border-r border-border flex-col">
        <ChatSidebar />
      </div>

      {/* Mobile Drawer Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <Button size="icon" variant="ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="cursor-pointer">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-3/4 bg-background z-50 md:hidden border-r border-border flex flex-col overflow-hidden">
            <ChatSidebar onChatSelect={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Chat Window Area */}
      <div className="w-full md:flex-1 flex items-center justify-center bg-background text-muted-foreground">
        <p>Select a chat to start messaging</p>
      </div>
    </div>
  )
}
