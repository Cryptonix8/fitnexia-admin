import type { ReactNode } from 'react'

type DataPanelProps = {
  title?: string
  toolbar?: ReactNode
  children: ReactNode
}

export default function DataPanel({ title, toolbar, children }: DataPanelProps) {
  return (
    <section className="dataPanel">
      {title || toolbar ? (
        <div className="dataPanelHeader">
          {title ? <h2 className="dataPanelTitle">{title}</h2> : <span />}
          {toolbar ? <div className="dataPanelToolbar">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className="dataPanelBody">{children}</div>
    </section>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">○</div>
      <div className="emptyStateTitle">{title}</div>
      {description ? <div className="emptyStateDesc">{description}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loadingState">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="alert alertError" role="alert">
      {message}
    </div>
  )
}
