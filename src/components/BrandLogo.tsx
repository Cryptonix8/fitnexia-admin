import logo from '../assets/logo.png'

type BrandLogoProps = {
  subtitle?: string
  compact?: boolean
}

export default function BrandLogo({ subtitle, compact }: BrandLogoProps) {
  return (
    <div className={`brand${compact ? ' brandCompact' : ''}`}>
      <img src={logo} alt="Fitnexia" className="brandLogo" />
      {!compact ? (
        <div style={{ minWidth: 0 }}>
          <div className="brandTitle">Fitnexia Admin</div>
          {subtitle ? (
            <div className="brandSub" title={subtitle}>
              {subtitle}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
