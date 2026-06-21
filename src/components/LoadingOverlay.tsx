import { useId } from 'react'

type LoadingOverlayProps = {
  show: boolean
  label?: string
}

export default function LoadingOverlay({ show, label = 'Loading…' }: LoadingOverlayProps) {
  const gradientId = useId().replace(/:/g, '')

  if (!show) return null

  return (
    <div className="loadingOverlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loadingOverlayInner">
        <div className="loadingOverlaySpinner">
          <svg
            className="loadingOverlayRing"
            viewBox="0 0 120 120"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <circle
              className="loadingOverlayRingTrack"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="3"
            />
            <circle
              className="loadingOverlayRingArc"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="82 245"
            />
          </svg>
          <span className="loadingOverlayBrand">FITNEXIA</span>
        </div>
        <p className="loadingOverlayLabel">{label}</p>
      </div>
    </div>
  )
}
