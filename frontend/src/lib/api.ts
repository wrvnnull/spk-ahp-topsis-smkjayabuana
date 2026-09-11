import type { User, LoginRequest } from "@/types/api"

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
      throw {
        message: errorBody.message || `HTTP ${response.status}`,
        statusCode: response.status,
        error: response.statusText,
      } as { message: string; statusCode: number; error?: string }
    }

    return response.json()
  }

  // Auth
  async login(credentials: LoginRequest): Promise<User> {
    return this.request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST" })
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me")
  }

  // Academic Periods
  async getAcademicPeriods(): Promise<import("@/types/api").AcademicPeriod[]> {
    return this.request("/academic-periods")
  }

  async getAcademicPeriod(id: string): Promise<import("@/types/api").AcademicPeriod> {
    return this.request(`/academic-periods/${id}`)
  }

  async createAcademicPeriod(
    data: { name: string; school_year: string; semester: "GANJIL" | "GENAP"; is_active?: boolean }
  ): Promise<import("@/types/api").AcademicPeriod> {
    return this.request("/academic-periods", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateAcademicPeriod(id: string, data: Partial<import("@/types/api").AcademicPeriod>): Promise<import("@/types/api").AcademicPeriod> {
    return this.request(`/academic-periods/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteAcademicPeriod(id: string): Promise<void> {
    await this.request(`/academic-periods/${id}`, { method: "DELETE" })
  }

  async setActiveAcademicPeriod(id: string): Promise<import("@/types/api").AcademicPeriod> {
    return this.request(`/academic-periods/${id}/set-active`, { method: "PATCH" })
  }

  // Classes
  async getClasses(): Promise<import("@/types/api").ClassRoom[]> {
    return this.request("/classes")
  }

  async getClass(id: string): Promise<import("@/types/api").ClassRoom> {
    return this.request(`/classes/${id}`)
  }

  async createClass(
    data: { name: string; academic_period_id: string; wali_teacher_id: string }
  ): Promise<import("@/types/api").ClassRoom> {
    return this.request("/classes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateClass(id: string, data: Partial<import("@/types/api").ClassRoom>): Promise<import("@/types/api").ClassRoom> {
    return this.request(`/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteClass(id: string): Promise<void> {
    await this.request(`/classes/${id}`, { method: "DELETE" })
  }

  // Students
  async getStudents(): Promise<import("@/types/api").Student[]> {
    return this.request("/students")
  }

  async getStudent(id: string): Promise<import("@/types/api").Student> {
    return this.request(`/students/${id}`)
  }

  async createStudent(
    data: { class_id: string; student_code?: string; name: string; is_active?: boolean }
  ): Promise<import("@/types/api").Student> {
    return this.request("/students", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateStudent(id: string, data: Partial<import("@/types/api").Student>): Promise<import("@/types/api").Student> {
    return this.request(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getStudentScores(id: string): Promise<{ student_id: string; scores: import("@/types/api").Score[] }> {
    return this.request(`/students/${id}/scores`)
  }

  // Criteria
  async getCriteria(): Promise<import("@/types/api").Criteria[]> {
    return this.request("/criteria")
  }

  async getCriteriaById(id: string): Promise<import("@/types/api").Criteria> {
    return this.request(`/criteria/${id}`)
  }

  async createCriteria(
    data: { code: string; name: string; type: "BENEFIT" | "COST"; description?: string; is_active?: boolean }
  ): Promise<import("@/types/api").Criteria> {
    return this.request("/criteria", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCriteria(id: string, data: Partial<import("@/types/api").Criteria>): Promise<import("@/types/api").Criteria> {
    return this.request(`/criteria/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteCriteria(id: string): Promise<void> {
    await this.request(`/criteria/${id}`, { method: "DELETE" })
  }

  // Scores
  async getScores(): Promise<import("@/types/api").Score[]> {
    return this.request("/scores")
  }

  async createScore(
    data: {
      student_id: string
      criteria_id: string
      academic_period_id: string
      value?: number
      is_missing?: boolean
      note?: string
    }
  ): Promise<import("@/types/api").Score> {
    return this.request("/scores", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createBulkScores(
    scores: {
      student_id: string
      criteria_id: string
      academic_period_id: string
      value?: number
      is_missing?: boolean
      note?: string
    }[]
  ): Promise<import("@/types/api").Score[]> {
    return this.request("/scores/bulk", {
      method: "POST",
      body: JSON.stringify({ scores }),
    })
  }

  async updateScore(id: string, data: Partial<import("@/types/api").Score>): Promise<import("@/types/api").Score> {
    return this.request(`/scores/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteScore(id: string): Promise<void> {
    await this.request(`/scores/${id}`, { method: "DELETE" })
  }

  // AHP
  async createAhpComparison(
    data: {
      academic_period_id: string
      criteria_i_id: string
      criteria_j_id: string
      comparison_value: number
    }
  ): Promise<import("@/types/api").AhpComparison> {
    return this.request("/ahp/comparisons", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createBulkAhpComparisons(
    comparisons: {
      academic_period_id: string
      criteria_i_id: string
      criteria_j_id: string
      comparison_value: number
    }[]
  ): Promise<import("@/types/api").AhpComparison[]> {
    return this.request("/ahp/comparisons/bulk", {
      method: "POST",
      body: JSON.stringify({ comparisons }),
    })
  }

  async getAhpComparisons(): Promise<{ message: string }> {
    return this.request("/ahp/comparisons")
  }

  async getAhpMatrix(academic_period_id: string): Promise<import("@/types/api").AhpMatrix> {
    return this.request(`/ahp/comparisons/matrix?academic_period_id=${academic_period_id}`)
  }

  async calculateAHP(academic_period_id: string): Promise<import("@/types/api").AhpCalculation> {
    return this.request("/ahp/calculate", {
      method: "POST",
      body: JSON.stringify({ academic_period_id }),
    })
  }

  async getAhpCalculations(): Promise<import("@/types/api").AhpCalculation[]> {
    return this.request("/ahp/calculations")
  }

  async getAhpCalculationById(id: string): Promise<import("@/types/api").AhpCalculation> {
    return this.request(`/ahp/calculations/${id}`)
  }

  // TOPSIS
  async calculateTopsis(
    academic_period_id: string,
    ahp_calculation_id?: string
  ): Promise<import("@/types/api").TopsisCalculation> {
    return this.request("/topsis/calculate", {
      method: "POST",
      body: JSON.stringify({ academic_period_id, ahp_calculation_id }),
    })
  }

  async getTopsisRanking(): Promise<import("@/types/api").TopsisRanking[]> {
    return this.request("/topsis/ranking")
  }

  async getTopsisCalculationById(id: string): Promise<import("@/types/api").TopsisCalculation> {
    return this.request(`/topsis/calculations/${id}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient
