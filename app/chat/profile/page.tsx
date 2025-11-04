"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  username: string
  display_name: string
  profile_picture_url?: string
  theme_preference: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      console.log("[v0] Fetching profile for user ID:", user.id)

      let { data: userProfile, error } = await supabase.from("users").select("*").eq("id", user.id)

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error fetching profile:", error)
        setError(`Failed to load profile: ${error.message}`)
        return
      }

      // If profile doesn't exist, create it
      if (!userProfile || userProfile.length === 0) {
        console.log("[v0] Profile doesn't exist, creating new profile")
        const email = user.email || "User"
        const newProfile = {
          id: user.id,
          username: user.user_metadata?.username || email.split("@")[0],
          display_name: user.user_metadata?.display_name || email,
          profile_picture_url: null,
          theme_preference: "light",
        }

        const { error: createError } = await supabase.from("users").insert([newProfile])

        if (createError) {
          console.error("[v0] Error creating profile:", createError)
          setError(`Failed to create profile: ${createError.message}`)
          return
        }

        userProfile = [newProfile]
      }

      const profile = userProfile[0]
      console.log("[v0] Profile loaded successfully:", profile)
      setProfile(profile)
      setDisplayName(profile.display_name)
      setUsername(profile.username)
      setProfilePictureUrl(profile.profile_picture_url || "")
    } catch (err) {
      console.error("[v0] Exception loading profile:", err)
      setError("Failed to load profile")
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username are required")
      return
    }

    setIsSaving(true)
    setError("")
    setSuccessMessage("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if username is already taken (by another user)
      if (username !== profile?.username) {
        const { data: existingUser } = await supabase.from("users").select("id").eq("username", username).single()

        if (existingUser) {
          setError("Username is already taken")
          setIsSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          username: username,
          profile_picture_url: profilePictureUrl,
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile({
        ...profile!,
        display_name: displayName,
        username: username,
        profile_picture_url: profilePictureUrl,
      })

      setIsEditing(false)
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      console.error("Error saving profile:", err)
      setError("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (err) {
      console.error("Error logging out:", err)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-md bg-opacity-80">
        <div className="flex items-center justify-between p-4">
          <Link href="/chat">
            <Button size="icon" variant="ghost" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 rounded-lg text-sm">{error}</div>
        )}

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isEditing}
              className="mt-1 rounded-lg"
              placeholder="Your display name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing}
              className="mt-1 rounded-lg"
              placeholder="@username"
            />
            <p className="text-xs text-muted-foreground mt-1">Others search for you using this name</p>
          </div>

          {/* Profile Picture URL */}
          {isEditing && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profile Picture URL</label>
              <Input
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
                className="mt-1 rounded-lg"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter a direct image URL</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="w-full rounded-lg h-12">
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full rounded-lg h-12">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setDisplayName(profile.display_name)
                  setUsername(profile.username)
                  setProfilePictureUrl(profile.profile_picture_url || "")
                  setError("")
                }}
                variant="outline"
                className="w-full rounded-lg h-12"
              >
                Cancel
              </Button>
            </>
          )}

          <Button onClick={handleLogout} variant="destructive" className="w-full rounded-lg h-12">
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
