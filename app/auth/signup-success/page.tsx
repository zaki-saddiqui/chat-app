"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent you a confirmation link. Please verify your email to continue.
          </p>
        </div>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full rounded-lg h-10 bg-transparent">
            Back to Sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
