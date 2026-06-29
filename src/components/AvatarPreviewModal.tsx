import UserAvatar from './UserAvatar'
import type { AdminUserListItem } from '../lib/types'

type AvatarPreviewModalProps = {
  user: AdminUserListItem | null
  onClose: () => void
}

export default function AvatarPreviewModal({ user, onClose }: AvatarPreviewModalProps) {
  if (!user) return null

  const label = user.displayName?.trim() || user.email

  return (
    <div className="modalBackdrop" onClick={onClose} role="presentation">
      <div
        className="modal avatarPreviewModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h2 id="avatar-preview-title" className="modalTitle">
              {label}
            </h2>
            {user.displayName ? <p className="modalSub">{user.email}</p> : null}
          </div>
          <button type="button" className="btn btnGhost btnSm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody avatarPreviewBody">
          <UserAvatar
            name={user.displayName}
            email={user.email}
            avatarUrl={user.avatarUrl}
            size="lg"
          />
        </div>
      </div>
    </div>
  )
}
