"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface NewChatModalProps {
  onClose: () => void
  onChatCreated: () => void
}

export function NewChatModal({ onClose, onChatCreated }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setError("")

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setError("Not authenticated")
        setIsLoading(false)
        return
      }

      console.log("[v0] Searching for username:", query)

      // Fetch all users and filter client-side to avoid RLS issues
      const { data: allUsers, error: fetchError } = await supabase
        .from("users")
        .select("id, username, display_name, profile_picture_url")
        .neq("id", currentUser.id)

      if (fetchError) {
        console.error("[v0] Fetch error:", fetchError)
        setError("Failed to search users")
        setIsLoading(false)
        return
      }

      console.log("[v0] All users fetched:", allUsers)

      // Filter by username (case-insensitive)
      const filtered = (allUsers || []).filter((user) => user.username.toLowerCase().includes(query.toLowerCase()))

      console.log("[v0] Filtered results:", filtered)
      setSearchResults(filtered)
    } catch (error) {
      console.error("[v0] Search error:", error)
      setError("Error searching users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartChat = async (userId: string) => {
    setIsCreating(true)
    try {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) return

      const user1_id = currentUser.id < userId ? currentUser.id : userId
      const user2_id = currentUser.id < userId ? userId : currentUser.id

      // Create or get conversation
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", user1_id)
        .eq("user2_id", user2_id)
        .single()

      if (existingConv) {
        onChatCreated()
        onClose()
        return
      }

      const { error } = await supabase.from("conversations").insert({
        user1_id,
        user2_id,
      })

      if (error) throw error
      onChatCreated()
      onClose()
    } catch (error) {
      console.error("[v0] Error creating chat:", error)
      setError("Failed to create chat")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>Search for users by username</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-lg"
            autoFocus
          />

          {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}

          <div className="max-h-64 overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}

            {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>}

            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.profile_picture_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleStartChat(user.id)}
                  disabled={isCreating}
                  className="rounded-full"
                >
                  Chat
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
