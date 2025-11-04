"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState("")
  const [theme, setTheme] = useState("light")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userData) {
        setUser(userData)
        setDisplayName(userData.display_name)
        setTheme(userData.theme_preference || "light")
      }

      setIsLoading(false)
    }

    loadUser()
  }, [router])

  const handleSaveSettings = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          theme_preference: theme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Apply theme
      const htmlElement = document.documentElement
      if (theme === "dark") {
        htmlElement.classList.add("dark")
      } else {
        htmlElement.classList.remove("dark")
      }

      setMessage({ type: "success", text: "Settings saved successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center py-12 px-4">
        <Link href="/chat" className="mb-6 flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.username} disabled className="rounded-lg" />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email || ""} disabled className="rounded-lg" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {message && (
            <div
              className={`p-4 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full rounded-lg h-10">
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>

          <Button onClick={handleLogout} variant="outline" className="w-full rounded-lg h-10 bg-transparent">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
