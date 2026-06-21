type LoadingOverlayProps = {
  show: boolean
  label?: string
}

export default function LoadingOverlay({ show, label = 'Loading…' }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div className="loadingOverlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loadingOverlayCard">
        <div className="spinner spinnerLg" />
        <span className="loadingOverlayLabel">{label}</span>
      </div>
    </div>
  )
}
