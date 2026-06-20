import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DataPanel, { ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import { api } from '../lib/api'
import type { UserRole } from '../lib/types'

type AdminUser = { id: string; email: string; role: UserRole; createdAt: string }

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
  const [role, setRole] = useState<UserRole>('athlete')

  const q = useQuery({
    queryKey: ['admin', 'users', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<AdminUser>(`/admin/users/${id}`)).data,
  })

  useEffect(() => {
    if (!q.data) return
    setRole(q.data.role)
  }, [q.data?.role])

  const patch = useMutation({
    mutationFn: async (nextRole: UserRole) =>
      (await api.patch(`/admin/users/${id}`, { role: nextRole })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      await qc.invalidateQueries({ queryKey: ['admin', 'users', id] })
    },
  })

  return (
    <>
      <PageHeader
        title={q.data?.email ?? 'User'}
        description="View account details and update role permissions."
        breadcrumb={
          <>
            <Link to="/users">Users</Link>
            {' / '}
            <span className="mono">{id?.slice(0, 8)}…</span>
          </>
        }
        actions={
          <button className="btn btnSm" onClick={() => navigate(-1)}>
            ← Back
          </button>
        }
      />

      <DataPanel>
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorBanner message="Failed to load user details." /> : null}

        {q.data ? (
          <div style={{ padding: 22 }}>
            <div className="detailGrid">
              <div className="detailItem">
                <div className="detailItemLabel">Email</div>
                <div className="detailItemValue">{q.data.email}</div>
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

            <div className="rolePanel">
              <div className="rolePanelTitle">Change role</div>
              <div className="rolePanelDesc">
                Assign a new platform role. Changes take effect on the user&apos;s next login.
              </div>
              <div className="row">
                <select
                  className="input"
                  style={{ maxWidth: 220 }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="athlete">Athlete</option>
                  <option value="instructor">Instructor</option>
                  <option value="institution">Institution</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="btn btnPrimary btnSm"
                  disabled={!id || patch.isPending || role === q.data.role}
                  onClick={() => patch.mutate(role)}
                >
                  {patch.isPending ? 'Saving…' : 'Save changes'}
                </button>
                {patch.isError ? <span className="pill pillDanger">Update failed</span> : null}
                {patch.isSuccess ? <span className="pill pillOk">Saved</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </DataPanel>
    </>
  )
}
