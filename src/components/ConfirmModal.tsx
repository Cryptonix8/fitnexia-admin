type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="modalBackdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h2 id="confirm-modal-title" className="modalTitle">
              {title}
            </h2>
          </div>
          <button type="button" className="btn btnGhost btnSm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <p id="confirm-modal-message" className="confirmModalMessage">
            {message}
          </p>
          <div className="modalFooter row">
            <button type="button" className="btn btnSm" onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="button" className="btn btnDanger btnSm" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
