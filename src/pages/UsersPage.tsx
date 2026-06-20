import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import UserEditModal from '../components/UserEditModal'
import { IconPencil, IconTrash } from '../components/icons'
import { api } from '../lib/api'
import { getStoredUser } from '../lib/storage'
import type { AdminUserListItem, Paginated, UserRole } from '../lib/types'

const PAGE_SIZE = 10

const ROLES: { value: '' | UserRole; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'athlete', label: 'Athlete' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'institution', label: 'Institution' },
  { value: 'admin', label: 'Admin' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function shortId(id: string) {
  return `${id.slice(0, 8)}…`
}

function buildParams(params: Record<string, string>) {
  const next = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) next.set(key, value)
  })
  return next
}

export default function UsersPage() {
  const qc = useQueryClient()
  const currentUser = getStoredUser()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit = PAGE_SIZE
  const q = searchParams.get('q') ?? ''
  const roleFilter = searchParams.get('role') ?? ''

  const [searchInput, setSearchInput] = useState(q)
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    }
    if (q) params.q = q
    if (roleFilter) params.role = roleFilter
    return params
  }, [page, limit, q, roleFilter])

  const listQuery = useQuery({
    queryKey: ['admin', 'users', queryParams],
    queryFn: async () =>
      (await api.get<Paginated<AdminUserListItem>>('/admin/users', { params: queryParams })).data,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setActionError(
        axiosErr.response?.data?.error?.message || 'Failed to delete user',
      )
    },
  })

  const totalPages = listQuery.data?.meta.totalPages ?? 1

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nextQ = String(fd.get('q') ?? '').trim()
    const nextRole = String(fd.get('role') ?? '')
    setSearchParams(
      buildParams({
        page: '1',
        q: nextQ,
        role: nextRole,
      }),
    )
  }

  function clearFilters() {
    setSearchInput('')
    setSearchParams({})
  }

  function changePage(nextPage: number) {
    setSearchParams(
      buildParams({
        page: String(nextPage),
        q,
        role: roleFilter,
      }),
    )
  }

  function handleDelete(user: AdminUserListItem) {
    const label = user.displayName || user.email
    const ok = window.confirm(
      `Delete "${label}"?\n\nThis soft-deletes the account and revokes active sessions.`,
    )
    if (!ok) return
    remove.mutate(user.id)
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Search, filter, edit roles, and remove accounts from the platform."
      />

      {actionError ? (
        <div className="alert alertError" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      ) : null}

      <div className="filterBar">
        <form className="filterBarForm" onSubmit={applyFilters}>
          <label className="field filterField">
            <span className="fieldLabel">Search</span>
            <input
              className="input"
              type="search"
              name="q"
              placeholder="Name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>

          <label className="field filterField">
            <span className="fieldLabel">Role</span>
            <select
              className="input"
              name="role"
              value={roleFilter}
              onChange={(e) => {
                const nextRole = e.target.value
                setSearchParams(
                  buildParams({
                    page: '1',
                    q,
                    role: nextRole,
                  }),
                )
              }}
            >
              {ROLES.map((r) => (
                <option key={r.value || 'all'} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="filterActions">
            <button className="btn btnPrimary btnSm" type="submit">
              Search
            </button>
            <button className="btn btnSm" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <DataPanel
        title="All users"
        toolbar={
          listQuery.data ? (
            <span className="pill">{listQuery.data.meta.total.toLocaleString()} matching</span>
          ) : null
        }
      >
        {listQuery.isLoading ? <LoadingState /> : null}
        {listQuery.isError ? <ErrorBanner message="Failed to load users." /> : null}

        {listQuery.data && listQuery.data.data.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              q || roleFilter
                ? 'Try adjusting your search or role filter.'
                : 'There are no users in the system yet.'
            }
          />
        ) : null}

        {listQuery.data && listQuery.data.data.length > 0 ? (
          <>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listQuery.data.data.map((u) => {
                    const isSelf = currentUser?.id === u.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <Link to={`/users/${u.id}`} className="tableCellTitle">
                            {u.email}
                          </Link>
                        </td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <Link to={`/users/${u.id}`} className="tableLink" title={u.id}>
                            {shortId(u.id)}
                          </Link>
                        </td>
                        <td>
                          <div className="btnGroup">
                            <button
                              type="button"
                              className="btn btnIcon btnSm"
                              aria-label={`Edit ${u.email}`}
                              title="Edit"
                              onClick={() => setEditingUser(u)}
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              className="btn btnIcon btnDanger btnSm"
                              disabled={isSelf || remove.isPending}
                              aria-label={`Delete ${u.email}`}
                              title={isSelf ? 'You cannot delete your own account' : 'Delete'}
                              onClick={() => handleDelete(u)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </>
        ) : null}
      </DataPanel>

      <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} />
    </>
  )
}
