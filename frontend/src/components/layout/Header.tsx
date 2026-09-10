"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuthContext"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ({ className, ...props }, ref) {
    const { user, logout } = useAuth()
    const router = useRouter()

    const handleLogout = async () => {
      try {
        await apiClient.logout()
      } catch (error) {
        console.error("Logout failed:", error)
      }
      logout()
      router.push("/login")
    }

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              SPK
            </div>
            <span className="text-sm font-semibold">AHP-TOPSIS</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm md:block">
                <span className="text-muted-foreground">Hi, </span>
                <span className="font-medium">{user.name}</span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8"
                aria-label="Logout"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }
