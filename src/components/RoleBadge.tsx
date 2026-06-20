import type { UserRole } from '../lib/types'

const roleClass: Record<UserRole, string> = {
  admin: 'badgeAdmin',
  athlete: 'badgeAthlete',
  instructor: 'badgeInstructor',
  institution: 'badgeInstitution',
}

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  athlete: 'Athlete',
  instructor: 'Instructor',
  institution: 'Institution',
}

export default function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`badge ${roleClass[role]}`}>{roleLabel[role]}</span>
}
