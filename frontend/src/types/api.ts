export interface User {
  id: string
  email: string
  name: string
  role: "SUPER_ADMIN" | "GURU" | "KEPALA_SEKOLAH"
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
}

export interface ApiError {
  status: number
  message: string
  statusText: string
}
