import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DataPanel, { ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import { api } from '../lib/api'
import { getStoredUser } from '../lib/storage'
import type { AdminUserListItem, UserRole } from '../lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const currentUser = getStoredUser()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('athlete')
  const [error, setError] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['admin', 'users', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<AdminUserListItem>(`/admin/users/${id}`)).data,
  })

  useEffect(() => {
    if (!q.data) return
    setEmail(q.data.email)
    setRole(q.data.role)
  }, [q.data])

  const save = useMutation({
    mutationFn: async () => (await api.patch(`/admin/users/${id}`, { email, role })).data,
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      await qc.invalidateQueries({ queryKey: ['admin', 'users', id] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setError(axiosErr.response?.data?.error?.message || 'Failed to update user')
    },
  })

  const remove = useMutation({
    mutationFn: async () => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      navigate('/users')
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setError(axiosErr.response?.data?.error?.message || 'Failed to delete user')
    },
  })

  const isSelf = currentUser?.id === id
  const isDirty = q.data ? email !== q.data.email || role !== q.data.role : false

  function handleDelete() {
    const label = q.data?.displayName || q.data?.email || 'this user'
    const ok = window.confirm(`Delete "${label}"? This cannot be undone from the admin panel.`)
    if (!ok) return
    remove.mutate()
  }

  return (
    <>
      <PageHeader
        title={q.data?.displayName || q.data?.email || 'User'}
        description="View account details, update email/role, or remove the account."
        breadcrumb={
          <>
            <Link to="/users">Users</Link>
            {' / '}
            <span className="mono">{id?.slice(0, 8)}…</span>
          </>
        }
        actions={
          <div className="row">
            <button className="btn btnSm" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              className="btn btnDanger btnSm"
              disabled={isSelf || remove.isPending}
              onClick={handleDelete}
            >
              Delete user
            </button>
          </div>
        }
      />

      <DataPanel>
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorBanner message="Failed to load user details." /> : null}
        {error ? <div className="alert alertError">{error}</div> : null}

        {q.data ? (
          <div style={{ padding: 22 }}>
            <div className="detailGrid">
              <div className="detailItem">
                <div className="detailItemLabel">Display name</div>
                <div className="detailItemValue">{q.data.displayName || '—'}</div>
              </div>
              <div className="detailItem">
                <div className="detailItemLabel">Current role</div>
                <div className="detailItemValue">
                  <RoleBadge role={q.data.role} />
                </div>
              </div>
              <div className="detailItem">
                <div className="detailItemLabel">Member since</div>
                <div className="detailItemValue">{formatDate(q.data.createdAt)}</div>
              </div>
              <div className="detailItem">
                <div className="detailItemLabel">User ID</div>
                <div className="detailItemValue mono">{q.data.id}</div>
              </div>
            </div>

            <form
              className="rolePanel stack"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                save.mutate()
              }}
            >
              <div className="rolePanelTitle">Edit account</div>
              <div className="rolePanelDesc">Update email or role. Sessions refresh on next login.</div>

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
                  style={{ maxWidth: 280 }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="athlete">Athlete</option>
                  <option value="instructor">Instructor</option>
                  <option value="institution">Institution</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <div className="row">
                <button
                  className="btn btnPrimary btnSm"
                  type="submit"
                  disabled={!id || save.isPending || !isDirty}
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
                {save.isSuccess && !isDirty ? <span className="pill pillOk">Saved</span> : null}
              </div>
            </form>
          </div>
        ) : null}
      </DataPanel>
    </>
  )
}
