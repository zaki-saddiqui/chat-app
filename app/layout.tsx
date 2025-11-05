// "use client"

// import type React from "react"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"
// import { ChatSidebar } from "@/components/chat-sidebar"

// export default function ChatLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter()

//   useEffect(() => {
//     const checkAuth = async () => {
//       const supabase = createClient()
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) {
//         router.push("/auth/login")
//       }
//     }
//     checkAuth()
//   }, [router])

//   return (
//     <div className="flex h-screen w-full gap-0">
//       <div className="w-1/4 max-w-xs border-r border-border">
//         <ChatSidebar />
//       </div>
//       {/* Main content area - only this changes when navigating */}
//       <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">{children}</div>
//     </div>
//   )
// }


import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Messages",
  description: "Modern chat application",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
