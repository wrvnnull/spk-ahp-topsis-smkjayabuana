import type { User, LoginRequest, LoginResponse } from "@/types/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE.replace(/\/+$/, "")
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...headers,
        ...options.headers as Record<string, string>,
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new ApiError(
        response.status,
        errorBody.message || `HTTP ${response.status}`,
        response.statusText
      )
    }

    return response.json()
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async logout(): Promise<void> {
    return this.request("/auth/logout", { method: "POST" })
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me")
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public statusText: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const apiClient = new ApiClient()
export default apiClient
