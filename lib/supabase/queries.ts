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
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `,
      )
      .eq("user1_id", userId)
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
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `,
      )
      .eq("user2_id", userId)
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
