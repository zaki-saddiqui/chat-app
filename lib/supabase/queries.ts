import { createClient } from "@/lib/supabase/client"

export async function fetchUserConversations(userId: string) {
  const supabase = createClient()

  try {
    const { data: asUser1, error: error1 } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at,
        deleted_by_user1,
        deleted_by_user2,
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `,
      )
      .eq("user1_id", userId)
      .eq("deleted_by_user1", false)
      .order("updated_at", { ascending: false })

    const { data: asUser2, error: error2 } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user1_id,
        user2_id,
        created_at,
        updated_at,
        deleted_by_user1,
        deleted_by_user2,
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `,
      )
      .eq("user2_id", userId)
      .eq("deleted_by_user2", false)
      .order("updated_at", { ascending: false })

    if (error1) throw error1
    if (error2) throw error2

    const allConversations = [...(asUser1 || []), ...(asUser2 || [])].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )

    return allConversations
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
    return []
  }
}

export async function fetchUserById(userId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .select("username, display_name, profile_picture_url")
      .eq("id", userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return null
  }
}

export async function softDeleteConversation(conversationId: string, userId: string) {
  const supabase = createClient()

  try {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("user1_id, user2_id")
      .eq("id", conversationId)
      .single()

    if (!conversation) return false

    const isUser1 = conversation.user1_id === userId
    const updateData = isUser1 ? { deleted_by_user1: true } : { deleted_by_user2: true }

    const { error } = await supabase.from("conversations").update(updateData).eq("id", conversationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Error deleting conversation:", error)
    return false
  }
}

export async function restoreConversationIfDeleted(conversationId: string, userId: string) {
  const supabase = createClient()

  try {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("user1_id, user2_id, deleted_by_user1, deleted_by_user2")
      .eq("id", conversationId)
      .single()

    if (!conversation) return false

    const isUser1 = conversation.user1_id === userId
    const wasDeleted = isUser1 ? conversation.deleted_by_user1 : conversation.deleted_by_user2

    if (!wasDeleted) return false

    const updateData = isUser1 ? { deleted_by_user1: false } : { deleted_by_user2: false }

    const { error } = await supabase.from("conversations").update(updateData).eq("id", conversationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Error restoring conversation:", error)
    return false
  }
}
