export interface User {
  id: string
  username: string
  display_name: string
  profile_picture_url?: string
  theme_preference: "light" | "dark"
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  message_type: "text" | "image" | "file"
  content: string
  file_url?: string
  read_status: boolean
  created_at: string
}

export interface ChatUser {
  id: string
  username: string
  display_name: string
  profile_picture_url?: string
}
