export type UserRole = 'athlete' | 'instructor' | 'institution' | 'admin'

export type AuthResponse = {
  user: { id: string; email: string; role: UserRole }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type Paginated<T> = {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export type AdminUserListItem = {
  id: string
  email: string
  role: UserRole
  createdAt: string
  displayName?: string | null
}

export type VerificationRequest = {
  id: string
  subjectType: 'instructor' | 'institution'
  instructorId?: string | null
  institutionId?: string | null
  subjectName?: string | null
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

