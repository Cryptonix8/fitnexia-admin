import { useState } from 'react'
import { normalizeMediaUrl } from '../lib/media'

type UserAvatarProps = {
  name?: string | null
  email?: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

function getInitial(name?: string | null, email?: string) {
  const source = name?.trim() || email?.trim() || '?'
  return source.charAt(0).toUpperCase()
}

const sizeClass = {
  sm: 'Sm',
  md: 'Md',
  lg: 'Lg',
} as const

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'sm',
  onClick,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = normalizeMediaUrl(avatarUrl)
  const showImage = Boolean(imageSrc) && !imageFailed
  const initial = getInitial(name, email)
  const label = name?.trim() || email || 'User'

  const className = [
    'userAvatar',
    `userAvatar${sizeClass[size]}`,
    showImage ? 'userAvatarImage' : '',
    onClick ? 'userAvatarButton' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = showImage ? (
    <img
      className="userAvatarImg"
      src={imageSrc!}
      alt=""
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  ) : (
    initial
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-label={`View avatar for ${label}`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={className} aria-hidden={showImage ? undefined : true}>
      {content}
      <span className="srOnly">{label}</span>
    </span>
  )
}
