"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { User } from "@/types/api"
import { apiClient } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("spk_user")
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem("spk_user")
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login({ email, password })
      setUser(response.user)
      localStorage.setItem("spk_user", JSON.stringify(response.user))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("spk_user")
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
