// API Types - didefinisikan di sini agar tersedia untuk api.ts
export interface User {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'GURU' | 'KEPALA_SEKOLAH'
  owned_class_ids?: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

// Login response: backend mengembalikan user object langsung
export type LoginResponse = User

export interface AcademicPeriod {
  id: string
  name: string
  school_year: string
  semester: 'GANJIL' | 'GENAP'
  is_active: boolean
  created_at: string
}

export interface Criteria {
  id: string
  code: string
  name: string
  type: 'BENEFIT' | 'COST'
  is_active: boolean
  description: string | null
}

export interface ClassRoom {
  id: string
  name: string
  academic_period_id: string
  wali_teacher_id: string
  academic_period?: AcademicPeriod | null
  wali_teacher?: User | null
}

export interface Student {
  id: string
  class_id: string
  student_code: string | null
  name: string
  is_active: boolean
  class?: ClassRoom | null
}

export interface Score {
  id: string
  student_id: string
  criteria_id: string
  academic_period_id: string
  value: number | null
  is_missing: boolean
  note: string | null
  student?: Student | null
  criteria?: Criteria | null
  academicPeriod?: AcademicPeriod | null
}

export interface AhpComparison {
  id: string
  academic_period_id: string
  criteria_i_id: string
  criteria_j_id: string
  comparison_value: number
  criteriaI?: Criteria | null
  criteriaJ?: Criteria | null
}

export interface AhpMatrix {
  n: number
  matrix: number[][]
  comparisons_count: number
  criteria: Criteria[]
}

export interface AhpCalculation {
  id: string
  academic_period_id: string
  calculated_at: string
  ci: number
  cr: number | null
  ri: number
  weight_vector: Record<string, number>
  is_valid: boolean
  academic_period_name?: string | null
  lambda_max?: number
}

export interface TopsisCalculation {
  id: string
  academic_period_id: string
  ahp_calculation_id: string | null
  calculated_at: string
  academic_period_name?: string | null
  ahp?: {
    id: string
    weight_vector: Record<string, number>
    is_valid: boolean
    ci: number
    cr: number | null
    ri: number
  } | null
  decision_matrix: Record<string, Record<string, number>> | null
  normalized_matrix: Record<string, Record<string, number>> | null
  weighted_matrix: Record<string, Record<string, number>> | null
  ideal_positive: Record<string, number> | null
  ideal_negative: Record<string, number> | null
  distance_positive: Record<string, number> | null
  distance_negative: Record<string, number> | null
  preference_value: Record<string, number> | null
  rank: Record<string, number> | null
  created_by: string | null
  created_by_user?: { id: string; name: string; email: string } | null
}

export interface TopsisRanking {
  id: string
  academic_period_id: string
  academic_period_name?: string | null
  calculated_at?: string
  rank: Record<string, number> | null
  preference_value: Record<string, number> | null
  ahp?: {
    id: string
    weight_vector: Record<string, number>
    is_valid: boolean
    ci: number
    cr: number | null
    ri: number
    lambda_max?: number
  } | null
  academicPeriod?: AcademicPeriod | null
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
