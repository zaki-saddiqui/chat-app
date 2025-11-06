// "use client"

// import { useEffect, useState, useMemo } from "react"
// import { useRouter, useParams } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"
// import { ChatSidebar } from "@/components/chat-sidebar"
// import { ChatWindow } from "@/components/chat-window"

// export default function ConversationPage() {
//   const router = useRouter()
//   const params = useParams()
//   const conversationId = params.conversationId as string
//   const [recipientData, setRecipientData] = useState<any>(null)
//   const [isLoading, setIsLoading] = useState(true)

//   const memoizedConversationId = useMemo(() => conversationId, [conversationId])

//   useEffect(() => {
//     const loadConversation = async () => {
//       const supabase = createClient()
//       const {
//         data: { user: currentUser },
//       } = await supabase.auth.getUser()

//       if (!currentUser) {
//         router.push("/auth/login")
//         return
//       }

//       try {
//         // Get conversation details
//         const { data: conversation } = await supabase
//           .from("conversations")
//           .select("user1_id, user2_id")
//           .eq("id", memoizedConversationId)
//           .single()

//         if (!conversation) {
//           router.push("/chat")
//           return
//         }

//         const recipientId = conversation.user1_id === currentUser.id ? conversation.user2_id : conversation.user1_id

//         // Get recipient data
//         const { data: recipient } = await supabase
//           .from("users")
//           .select("id, display_name, profile_picture_url")
//           .eq("id", recipientId)
//           .single()

//         setRecipientData({
//           id: recipientId,
//           ...recipient,
//         })
//       } catch (error) {
//         console.error("Error loading conversation:", error)
//         router.push("/chat")
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     loadConversation()
//   }, [memoizedConversationId, router])

//   return (
//     <div className="flex h-screen w-full gap-0">
//       <div className="w-1/4 max-w-xs border-r border-border">
//         <ChatSidebar />
//       </div>
//       <div className="flex-1">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-full bg-background">
//             <p className="text-muted-foreground">Loading...</p>
//           </div>
//         ) : recipientData ? (
//           <ChatWindow
//             conversationId={memoizedConversationId}
//             recipientId={recipientData.id}
//             recipientName={recipientData.display_name}
//             recipientAvatar={recipientData.profile_picture_url}
//           />
//         ) : null}
//       </div>
//     </div>
//   )
// }


"use client"

import { useEffect, useState, useMemo } from "react"
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

  const memoizedConversationId = useMemo(() => conversationId, [conversationId])

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
        const { data: conversation } = await supabase
          .from("conversations")
          .select("user1_id, user2_id, deleted_by_user1, deleted_by_user2")
          .eq("id", memoizedConversationId)
          .single()

        if (!conversation) {
          router.push("/chat")
          return
        }

        const isUser1 = conversation.user1_id === currentUser.id
        const isDeleted = isUser1 ? conversation.deleted_by_user1 : conversation.deleted_by_user2

        if (isDeleted) {
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
  }, [memoizedConversationId, router])

  return (
    <div className="flex h-screen w-full gap-0">
      <div className="w-1/4 max-w-xs border-r border-border">
        <ChatSidebar />
      </div>
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-background">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : recipientData ? (
          <ChatWindow
            conversationId={memoizedConversationId}
            recipientId={recipientData.id}
            recipientName={recipientData.display_name}
            recipientAvatar={recipientData.profile_picture_url}
          />
        ) : null}
      </div>
    </div>
  )
}

