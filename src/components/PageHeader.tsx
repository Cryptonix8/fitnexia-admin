import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="pageHeader">
      <div className="pageHeaderMain">
        {breadcrumb ? <div className="breadcrumb">{breadcrumb}</div> : null}
        <h1 className="pageTitle">{title}</h1>
        {description ? <p className="pageDescription">{description}</p> : null}
      </div>
      {actions ? <div className="pageHeaderActions">{actions}</div> : null}
    </header>
  )
}
