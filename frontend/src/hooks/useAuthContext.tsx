"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { User } from "@/types/api"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  hasRole: (role: User["role"]) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

function useInitialUser(): User | null {
  // Hapus localStorage, gunakan cookie saja
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(useInitialUser)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verifikasi session dengan backend saat mount (hanya di client)
  useEffect(() => {
    const verifySession = async () => {
      try {
        const currentUser = await apiClient.getMe()
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login({ email, password })
      setUser(response)
      setIsAuthenticated(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
    } catch {
      // Ignore logout errors
    }
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const currentUser = await apiClient.getMe()
      setUser(currentUser)
      setIsAuthenticated(true)
    } catch {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasRole = useCallback(
    (role: User["role"]) => {
      return user?.role === role
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, logout, refreshSession, hasRole }}
    >
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

// Hook khusus untuk proteksi halaman
export function useRequireAuth(redirectTo: string = "/login") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// Hook untuk pengecekan role
export function useHasRole(role: User["role"]) {
  const { user } = useAuth()
  return user?.role === role
}
