import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: number | string
  icon: ReactNode
  tone?: 'primary' | 'accent' | 'success' | 'warning'
}

const toneClass = {
  primary: 'statCardPrimary',
  accent: 'statCardAccent',
  success: 'statCardSuccess',
  warning: 'statCardWarning',
} as const

export default function StatCard({ label, value, icon, tone = 'primary' }: StatCardProps) {
  return (
    <article className={`statCard ${toneClass[tone]}`}>
      <div className="statCardGlow" aria-hidden />
      <div className="statCardIcon">{icon}</div>
      <div className="statCardBody">
        <span className="statCardLabel">{label}</span>
        <span className="statCardValue">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </article>
  )
}
