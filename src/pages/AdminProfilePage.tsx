import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataPanel, { ErrorBanner } from '../components/DataPanel'
import LoadingOverlay from '../components/LoadingOverlay'
import PageHeader from '../components/PageHeader'
import PasswordInput from '../components/PasswordInput'
import { api } from '../lib/api'
import { clearAuth, updateStoredUser } from '../lib/storage'
import type { UserRole } from '../lib/types'

type MeResponse = {
  user: { id: string; email: string; role: UserRole }
}

export default function AdminProfilePage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get<MeResponse>('/auth/me')).data,
  })

  useEffect(() => {
    if (!q.data) return
    setEmail(q.data.user.email)
  }, [q.data])

  const save = useMutation({
    mutationFn: async () => {
      const trimmedEmail = email.trim()
      const emailChanged =
        q.data && trimmedEmail.toLowerCase() !== q.data.user.email.toLowerCase()
      const passwordChanged = Boolean(newPassword)

      if (!emailChanged && !passwordChanged) {
        throw new Error('Nothing to update')
      }

      if (passwordChanged) {
        if (!currentPassword) {
          throw new Error('Current password is required to set a new password')
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match')
        }
      }

      let user = q.data!.user

      if (emailChanged) {
        user = (await api.patch('/users/me', { email: trimmedEmail })).data as MeResponse['user']
      }

      if (passwordChanged) {
        await api.post('/auth/change-password', {
          currentPassword,
          newPassword,
        })
      }

      return { user, passwordChanged, emailChanged }
    },
    onSuccess: async ({ user, passwordChanged, emailChanged }) => {
      setError(null)

      if (passwordChanged) {
        clearAuth()
        navigate('/login', {
          replace: true,
          state: {
            message: emailChanged
              ? 'Account updated. Sign in with your new email and password.'
              : 'Password updated. Sign in with your new password.',
          },
        })
        return
      }

      setSuccess('Profile updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      updateStoredUser({ email: user.email })
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { error?: { message?: string } } }
        message?: string
      }
      setSuccess(null)
      setError(
        axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to update profile',
      )
    },
  })

  const isDirty =
    (q.data && email.trim().toLowerCase() !== q.data.user.email.toLowerCase()) ||
    Boolean(newPassword || currentPassword || confirmPassword)

  return (
    <>
      <LoadingOverlay
        show={q.isLoading || q.isFetching || save.isPending}
        label={save.isPending ? 'Saving profile…' : 'Loading profile…'}
      />

      <PageHeader
        title="My profile"
        description="Update your admin account email and password."
      />

      <DataPanel title="Account settings">
        {q.isError ? <ErrorBanner message="Failed to load profile." /> : null}
        {error ? <div className="alert alertError">{error}</div> : null}
        {success ? (
          <div
            className="alert alertError"
            style={{
              background: 'var(--success-soft)',
              color: 'var(--success)',
              borderColor: 'color-mix(in srgb, var(--success) 25%, transparent)',
            }}
          >
            {success}
          </div>
        ) : null}

        {q.data ? (
          <div style={{ padding: 22 }}>
            <form
              className="rolePanel stack"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                setSuccess(null)
                save.mutate()
              }}
            >
              <div className="rolePanelTitle">Edit account</div>
              <div className="rolePanelDesc">
                Change your login email or password. You will be signed out after changing your
                password.
              </div>

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

              <div className="rolePanelTitle" style={{ marginTop: 8 }}>
                Change password
              </div>
              <div className="rolePanelDesc">Leave blank to keep your current password.</div>

              <PasswordInput
                label="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />

              <PasswordInput
                label="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
                minLength={8}
              />

              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                minLength={8}
              />

              <div className="row">
                <button
                  className="btn btnPrimary btnSm"
                  type="submit"
                  disabled={save.isPending || !isDirty}
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </DataPanel>
    </>
  )
}
