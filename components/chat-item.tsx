// "use client"

// import type React from "react"

// import Link from "next/link"
// import { useState } from "react"
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { X } from "lucide-react"
// import { softDeleteConversation } from "@/lib/supabase/queries"
// import { createClient } from "@/lib/supabase/client"

// interface ChatItemProps {
//   chat: {
//     conversationId: string
//     userId: string
//     username: string
//     displayName: string
//     profilePicture?: string
//     lastMessage?: string
//     lastMessageTime?: string
//   }
//   onDelete?: () => void
// }

// export function ChatItem({ chat, onDelete }: ChatItemProps) {
//   const [isDeleting, setIsDeleting] = useState(false)

//   const handleDelete = async (e: React.MouseEvent) => {
//     e.preventDefault()
//     e.stopPropagation()

//     const supabase = createClient()
//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     if (!user) return

//     setIsDeleting(true)
//     const success = await softDeleteConversation(chat.conversationId, user.id)
//     if (success && onDelete) {
//       onDelete()
//     }
//     setIsDeleting(false)
//   }

//   return (
//     <Link href={`/chat/${chat.conversationId}`}>
//       <div className={`flex items-center gap-3 p-3 hover:bg-secondary transition-smooth cursor-pointer group`}>
//         <Avatar className="h-12 w-12 shrink-0">
//           <AvatarImage src={chat.profilePicture || "/placeholder.svg"} alt={chat.displayName} />
//           <AvatarFallback>{chat.displayName.charAt(0).toUpperCase()}</AvatarFallback>
//         </Avatar>

//         <div className="flex-1 min-w-0">
//           <div className="flex items-baseline justify-between gap-2">
//             <p className="font-medium text-foreground truncate">{chat.displayName}</p>
//             {chat.lastMessageTime && (
//               <p className="text-xs text-muted-foreground whitespace-nowrap">
//                 {new Date(chat.lastMessageTime).toLocaleDateString()}
//               </p>
//             )}
//           </div>
//           {chat.lastMessage && <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>}
//         </div>

//         <Button
//           size="icon"
//           variant="ghost"
//           className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
//           onClick={handleDelete}
//           disabled={isDeleting}
//         >
//           <X className="w-4 h-4" />
//         </Button>
//       </div>
//     </Link>
//   )
// }




















"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { softDeleteConversation } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"

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
  onDelete?: () => void
}

export function ChatItem({ chat, onDelete }: ChatItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setIsDeleting(true)
    const success = await softDeleteConversation(chat.conversationId, user.id)
    if (success && onDelete) {
      onDelete()
    }
    setIsDeleting(false)
  }

  return (
    <Link href={`/chat/${chat.conversationId}`}>
      <div
        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-secondary transition-smooth cursor-pointer group`}
      >
        <Avatar className="h-10 md:h-12 w-10 md:w-12 shrink-0">
          <AvatarImage
            src={chat.profilePicture || "/placeholder.svg"}
            alt={chat.displayName}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg"
            }}
          />
          <AvatarFallback>{chat.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium text-foreground truncate text-sm md:text-base">{chat.displayName}</p>
            {chat.lastMessageTime && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(chat.lastMessageTime).toLocaleDateString()}
              </p>
            )}
          </div>
          {chat.lastMessage && <p className="text-xs md:text-sm text-muted-foreground truncate">{chat.lastMessage}</p>}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Link>
  )
}
