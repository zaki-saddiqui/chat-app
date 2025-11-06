// "use client"

// import type React from "react"

// import { useEffect, useRef, useState } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send, ImageIcon, FileIcon } from "lucide-react"

// interface ChatWindowProps {
//   conversationId: string
//   recipientId: string
//   recipientName: string
//   recipientAvatar?: string
// }

// interface Message {
//   id: string
//   sender_id: string
//   content: string
//   message_type: string
//   file_url?: string
//   created_at: string
// }

// export function ChatWindow({ conversationId, recipientId, recipientName, recipientAvatar }: ChatWindowProps) {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [newMessage, setNewMessage] = useState("")
//   const [isLoading, setIsLoading] = useState(true)
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const subscriptionRef = useRef<any>(null)
//   const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null) // Added polling ref

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }

//   useEffect(() => {
//     scrollToBottom()
//   }, [messages])

//   // Load current user and messages
//   useEffect(() => {
//     const fetchData = async () => {
//       const supabase = createClient()
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       setCurrentUserId(user?.id || null)

//       if (user) {
//         const { data } = await supabase
//           .from("messages")
//           .select("*")
//           .eq("conversation_id", conversationId)
//           .order("created_at", { ascending: true })

//         setMessages(data || [])
//       }
//       setIsLoading(false)
//     }

//     fetchData()
//   }, [conversationId])

//   useEffect(() => {
//     const supabase = createClient()

//     // Subscribe to real-time changes
//     subscriptionRef.current = supabase
//       .channel(`messages:${conversationId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `conversation_id=eq.${conversationId}`,
//         },
//         (payload) => {
//           // console.log("New message received via realtime:", payload.new)
//           const newMsg = payload.new as Message
//           setMessages((prev) => {
//             // Check if message already exists to avoid duplicates
//             const exists = prev.some((m) => m.id === newMsg.id)
//             if (exists) return prev
//             return [...prev, newMsg]
//           })
//         },
//       )
//       .subscribe((status) => {
//         // console.log("Subscription status:", status)
//       })

//     // This helps if Realtime is not enabled in Supabase
//     pollingIntervalRef.current = setInterval(async () => {
//       const supabaseClient = createClient()
//       const { data } = await supabaseClient
//         .from("messages")
//         .select("*")
//         .eq("conversation_id", conversationId)
//         .order("created_at", { ascending: true })

//       if (data) {
//         setMessages((prev) => {
//           // Only update if there are new messages
//           if (data.length > prev.length) {
//             return data
//           }
//           return prev
//         })
//       }
//     }, 2000)

//     return () => {
//       if (subscriptionRef.current) {
//         subscriptionRef.current.unsubscribe()
//       }
//       if (pollingIntervalRef.current) {
//         clearInterval(pollingIntervalRef.current)
//       }
//     }
//   }, [conversationId])

//   // Load persisted draft from localStorage
//   useEffect(() => {
//     const draftKey = `chat-draft-${conversationId}`
//     const draft = localStorage.getItem(draftKey)
//     if (draft) {
//       setNewMessage(draft)
//     }
//   }, [conversationId])

//   // Save draft to localStorage
//   const handleMessageChange = (text: string) => {
//     setNewMessage(text)
//     const draftKey = `chat-draft-${conversationId}`
//     if (text.trim()) {
//       localStorage.setItem(draftKey, text)
//     } else {
//       localStorage.removeItem(draftKey)
//     }
//   }

//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!newMessage.trim() || !currentUserId) return

//     const tempId = `temp-${Date.now()}`
//     const optimisticMessage: Message = {
//       id: tempId,
//       sender_id: currentUserId,
//       content: newMessage,
//       message_type: "text",
//       created_at: new Date().toISOString(),
//     }

//     setMessages((prev) => [...prev, optimisticMessage])
//     const messageText = newMessage
//     setNewMessage("")
//     localStorage.removeItem(`chat-draft-${conversationId}`)

//     try {
//       const supabase = createClient()
//       const { data, error } = await supabase
//         .from("messages")
//         .insert({
//           conversation_id: conversationId,
//           sender_id: currentUserId,
//           receiver_id: recipientId,
//           message_type: "text",
//           content: messageText,
//         })
//         .select()

//       if (error) throw error

//       // console.log("Message sent successfully:", data)

//       // The real-time subscription will add the real message, and we deduplicate by ID
//       if (data && data[0]) {
//         const realMessage = data[0] as Message
//         setMessages(
//           (prev) =>
//             prev
//               .filter((m) => m.id !== tempId) // Remove optimistic message
//               .map((m) => (m.id === tempId ? realMessage : m)), // Replace if somehow still there
//         )
//       }
//     } catch (error) {
//       console.error("Error sending message:", error)
//       setMessages((prev) => prev.filter((m) => m.id !== tempId))
//       setNewMessage(messageText)
//     }
//   }

//   const handleImageClick = () => {
//     console.log("Image button clicked")
//     // TODO: Implement image upload
//   }

//   const handleFileClick = () => {
//     console.log("File button clicked")
//     // TODO: Implement file upload
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="text-muted-foreground">Loading conversation...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col h-full bg-background">
//       {/* Chat Header */}
//       <div className="px-6 py-4 border-b border-border flex items-center gap-3">
//         <Avatar className="h-10 w-10">
//           <AvatarImage src={recipientAvatar || "/placeholder.svg"} alt={recipientName} />
//           <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
//         </Avatar>
//         <div>
//           <h2 className="font-semibold text-foreground">{recipientName}</h2>
//           <p className="text-xs text-muted-foreground">Active now</p>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg) => (
//           <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
//             <div
//               className={`max-w-xs px-4 py-2 rounded-2xl ${
//                 msg.sender_id === currentUserId
//                   ? "bg-primary text-primary-foreground rounded-br-none"
//                   : "bg-muted text-muted-foreground rounded-bl-none"
//               }`}
//             >
//               {msg.message_type === "text" ? (
//                 <p className="text-sm wrap-break-word">{msg.content}</p>
//               ) : msg.message_type === "image" ? (
//                 <img src={msg.file_url || "/placeholder.svg"} alt="shared image" className="max-w-[200px] rounded-lg" />
//               ) : (
//                 <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
//                   {msg.content}
//                 </a>
//               )}
//               <p className="text-xs mt-1 opacity-70">
//                 {new Date(msg.created_at).toLocaleTimeString([], {
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 })}
//               </p>
//             </div>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Message Input */}
//       <div className="px-6 py-4 border-t border-border">
//         <form onSubmit={handleSendMessage} className="flex items-center gap-3">
//           <Button
//             type="button"
//             size="icon"
//             variant="ghost"
//             onClick={handleImageClick}
//             className="rounded-full cursor-pointer"
//           >
//             <ImageIcon className="w-5 h-5" />
//           </Button>
//           <Button
//             type="button"
//             size="icon"
//             variant="ghost"
//             onClick={handleFileClick}
//             className="rounded-full cursor-pointer"
//           >
//             <FileIcon className="w-5 h-5" />
//           </Button>
//           <Input
//             placeholder="Message..."
//             value={newMessage}
//             onChange={(e) => handleMessageChange(e.target.value)}
//             className="rounded-full border-input h-10"
//             disabled={!currentUserId}
//           />
//           <Button
//             type="submit"
//             size="icon"
//             disabled={!newMessage.trim() || !currentUserId}
//             className="rounded-full cursor-pointer"
//           >
//             <Send className="w-5 h-5" />
//           </Button>
//         </form>
//       </div>
//     </div>
//   )
// }






"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ImageIcon, FileIcon, Trash2 } from "lucide-react"

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

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
          const newMsg = payload.new as Message
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id)
            if (exists) return prev
            return [...prev, newMsg]
          })
        },
      )
      .subscribe()

    pollingIntervalRef.current = setInterval(async () => {
      const supabaseClient = createClient()
      const { data } = await supabaseClient
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages((prev) => {
          if (data.length > prev.length) {
            return data
          }
          return prev
        })
      }
    }, 2000)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [conversationId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const draftKey = `chat-draft-${conversationId}`
    const draft = localStorage.getItem(draftKey)
    if (draft) {
      setNewMessage(draft)
    }
  }, [conversationId])

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
        .select()

      if (error) throw error

      if (data && data[0]) {
        const realMessage = data[0] as Message
        setMessages((prev) => prev.filter((m) => m.id !== tempId).map((m) => (m.id === tempId ? realMessage : m)))
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(messageText)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("messages").delete().eq("id", messageId)

      if (error) throw error

      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      setContextMenu(null)
    } catch (error) {
      console.error("[v0] Error deleting message:", error)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, messageId })
  }

  const handleImageClick = () => {
    console.log("Image button clicked")
  }

  const handleFileClick = () => {
    console.log("File button clicked")
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
      <div className="px-4 md:px-6 py-4 border-b border-border flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipientAvatar || "/placeholder.svg"} alt={recipientName} />
          <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-foreground text-sm md:text-base">{recipientName}</h2>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
            onContextMenu={(e) => handleContextMenu(e, msg.id)}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl relative group ${
                msg.sender_id === currentUserId
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-muted-foreground rounded-bl-none"
              }`}
            >
              {msg.message_type === "text" ? (
                <p className="text-sm wrap-break-word">{msg.content}</p> 
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

              {msg.sender_id === currentUserId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 cursor-pointer"
                  onClick={() => handleDeleteMessage(msg.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-background border border-border rounded-md shadow-lg z-50"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-4 py-2 cursor-pointer rounded-none"
            onClick={() => {
              const msg = messages.find((m) => m.id === contextMenu.messageId)
              if (msg && msg.sender_id === currentUserId) {
                handleDeleteMessage(contextMenu.messageId)
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="px-4 md:px-6 py-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleImageClick}
            className="rounded-full cursor-pointer hidden md:inline-flex"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleFileClick}
            className="rounded-full cursor-pointer hidden md:inline-flex"
          >
            <FileIcon className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            className="rounded-full border-input h-10 text-sm md:text-base"
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
