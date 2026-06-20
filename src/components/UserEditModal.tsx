import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AdminUserListItem, UserRole } from '../lib/types'

type UserEditModalProps = {
  user: AdminUserListItem | null
  onClose: () => void
}

export default function UserEditModal({ user, onClose }: UserEditModalProps) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('athlete')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setEmail(user.email)
    setRole(user.role)
    setError(null)
  }, [user])

  const save = useMutation({
    mutationFn: async () =>
      (await api.patch(`/admin/users/${user!.id}`, { email, role })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      if (user) await qc.invalidateQueries({ queryKey: ['admin', 'users', user.id] })
      onClose()
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { error?: { message?: string } } }
        message?: string
      }
      setError(
        axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to save user',
      )
    },
  })

  if (!user) return null

  return (
    <div className="modalBackdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h2 id="edit-user-title" className="modalTitle">
              Edit user
            </h2>
            <p className="modalSub">
              {user.displayName ? `${user.displayName} · ` : ''}
              <span className="mono">{user.id.slice(0, 8)}…</span>
            </p>
          </div>
          <button type="button" className="btn btnGhost btnSm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form
          className="modalBody stack"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            save.mutate()
          }}
        >
          <label className="field">
            <span className="fieldLabel">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Role</span>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="athlete">Athlete</option>
              <option value="instructor">Instructor</option>
              <option value="institution">Institution</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error ? <div className="alert alertError">{error}</div> : null}

          <div className="modalFooter row">
            <button type="button" className="btn btnSm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary btnSm" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
