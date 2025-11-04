"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ChatItemProps {
  chat: {
    conversationId: string
    userId: string
    username: string
    displayName: string
    profilePicture?: string
    lastMessage?: string
    lastMessageTime?: string
  }
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ChatItem({ chat, isSelected, onSelect }: ChatItemProps) {
  return (
    <Link href={`/chat/${chat.conversationId}`}>
      <div
        onClick={() => onSelect(chat.conversationId)}
        className={`flex items-center gap-3 p-3 hover:bg-secondary transition-smooth cursor-pointer ${
          isSelected ? "bg-secondary" : ""
        }`}
      >
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={chat.profilePicture || "/placeholder.svg"} alt={chat.displayName} />
          <AvatarFallback>{chat.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium text-foreground truncate">{chat.displayName}</p>
            {chat.lastMessageTime && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(chat.lastMessageTime).toLocaleDateString()}
              </p>
            )}
          </div>
          {chat.lastMessage && <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>}
        </div>
      </div>
    </Link>
  )
}
