import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import LoadingOverlay from '../components/LoadingOverlay'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import UserEditModal from '../components/UserEditModal'
import UserAvatar from '../components/UserAvatar'
import AvatarPreviewModal from '../components/AvatarPreviewModal'
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

type DeleteConfirm =
  | { kind: 'single'; user: AdminUserListItem }
  | { kind: 'bulk'; ids: string[] }
  | null

export default function UsersPage() {
  const qc = useQueryClient()
  const currentUser = getStoredUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit = PAGE_SIZE
  const q = searchParams.get('q') ?? ''
  const roleFilter = searchParams.get('role') ?? ''

  const [searchInput, setSearchInput] = useState(q)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null)
  const [previewUser, setPreviewUser] = useState<AdminUserListItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setSearchInput(q)
  }, [q])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, q, roleFilter])

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
    placeholderData: (previousData) => previousData,
  })

  const pageUsers = listQuery.data?.data ?? []
  const selectableUsers = pageUsers.filter((u) => u.id !== currentUser?.id)
  const selectedOnPage = selectableUsers.filter((u) => selectedIds.has(u.id))
  const allPageSelected =
    selectableUsers.length > 0 && selectedOnPage.length === selectableUsers.length
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < selectableUsers.length

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected
    }
  }, [somePageSelected])

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: async () => {
      setActionError(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setActionError(axiosErr.response?.data?.error?.message || 'Failed to delete user')
    },
  })

  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) => {
      const failures: string[] = []
      for (const id of ids) {
        try {
          await api.delete(`/admin/users/${id}`)
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
          const user = pageUsers.find((u) => u.id === id)
          const label = user?.email ?? id.slice(0, 8)
          failures.push(`${label}: ${axiosErr.response?.data?.error?.message || 'Failed'}`)
        }
      }
      if (failures.length) {
        throw new Error(failures.join('\n'))
      }
    },
    onSuccess: async () => {
      setActionError(null)
      setSelectedIds(new Set())
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Failed to delete selected users')
    },
  })

  const totalPages = listQuery.data?.meta.totalPages ?? 1
  const isInitialLoading = listQuery.isLoading && listQuery.data === undefined
  const isRefetching = listQuery.isFetching && !isInitialLoading
  const isDeleting = remove.isPending || bulkRemove.isPending

  function handleSearchChange(value: string) {
    setSearchInput(value)
    const trimmed = value.trim()
    if (trimmed === q) return
    setSearchParams(
      buildParams({
        page: '1',
        q: trimmed,
        role: roleFilter,
      }),
    )
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

  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        selectableUsers.forEach((u) => next.delete(u.id))
        return next
      })
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      selectableUsers.forEach((u) => next.add(u.id))
      return next
    })
  }

  function handleDelete(user: AdminUserListItem) {
    setDeleteConfirm({ kind: 'single', user })
  }

  function handleBulkDelete() {
    const ids = [...selectedIds]
    if (!ids.length) return
    setDeleteConfirm({ kind: 'bulk', ids })
  }

  function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.kind === 'single') {
      remove.mutate(deleteConfirm.user.id)
    } else {
      bulkRemove.mutate(deleteConfirm.ids)
    }
    setDeleteConfirm(null)
  }

  const deleteModal =
    deleteConfirm?.kind === 'single'
      ? {
          title: 'Delete user',
          message: `Delete "${deleteConfirm.user.displayName || deleteConfirm.user.email}"?\n\nThis removes their account and all associated content (classes, memberships, etc.). Other users are not affected.`,
          confirmLabel: 'Delete user',
        }
      : deleteConfirm?.kind === 'bulk'
        ? {
            title: 'Delete selected users',
            message: `Delete ${deleteConfirm.ids.length} selected user${deleteConfirm.ids.length === 1 ? '' : 's'}?\n\nThis removes their accounts and all associated content. Other users are not affected.`,
            confirmLabel: 'Delete selected',
          }
        : null

  return (
    <>
      <LoadingOverlay
        show={isInitialLoading || isDeleting}
        label={
          isDeleting
            ? bulkRemove.isPending
              ? 'Deleting selected users…'
              : 'Deleting user…'
            : 'Loading users…'
        }
      />

      <PageHeader title="Users" />

      {actionError ? (
        <div className="alert alertError" style={{ marginBottom: 16, whiteSpace: 'pre-line' }}>
          {actionError}
        </div>
      ) : null}

      <div className="filterBar">
        <div className="filterBarForm">
          <label className="field filterField">
            <input
              className="input"
              type="search"
              placeholder="Name or email…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </label>

          <label className="field filterField">
            <select
              className="input"
              value={roleFilter}
              onChange={(e) => {
                const nextRole = e.target.value
                setSearchParams(
                  buildParams({
                    page: '1',
                    q: searchInput.trim(),
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
        </div>
      </div>

      <DataPanel
        title="All users"
        toolbar={
          <div className="bulkBar">
            {selectedIds.size > 0 ? (
              <>
                <span className="pill">{selectedIds.size} selected</span>
                <button
                  type="button"
                  className="btn btnDanger btnSm"
                  disabled={isDeleting}
                  onClick={handleBulkDelete}
                >
                  <IconTrash />
                  Delete selected
                </button>
              </>
            ) : null}
            {listQuery.data ? (
              <span className="pill">{listQuery.data.meta.total.toLocaleString()} matching</span>
            ) : null}
            {isRefetching ? <span className="pill">Updating…</span> : null}
          </div>
        }
      >
        {listQuery.isError ? <ErrorBanner message="Failed to load users." /> : null}

        {isInitialLoading ? <LoadingState label="Loading users…" /> : null}

        {!isInitialLoading && listQuery.data && listQuery.data.data.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              q || roleFilter
                ? 'Try adjusting your search or role filter.'
                : 'There are no users in the system yet.'
            }
          />
        ) : null}

        {!isInitialLoading && listQuery.data && listQuery.data.data.length > 0 ? (
          <>
            <div className={`tableWrap${isRefetching ? ' tableWrapBusy' : ''}`}>
              <table className="table">
                <thead>
                  <tr>
                    <th className="tableCheckCol">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="tableCheck"
                        checked={allPageSelected}
                        disabled={selectableUsers.length === 0 || isDeleting}
                        aria-label="Select all users on this page"
                        onChange={toggleSelectAllOnPage}
                      />
                    </th>
                    <th className="tableAvatarCol">Avatar</th>
                    <th>Name</th>
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
                        <td className="tableCheckCol">
                          <input
                            type="checkbox"
                            className="tableCheck"
                            checked={selectedIds.has(u.id)}
                            disabled={isSelf || isDeleting}
                            aria-label={`Select ${u.email}`}
                            onChange={() => toggleUser(u.id)}
                          />
                        </td>
                        <td className="tableAvatarCol">
                          <UserAvatar
                            name={u.displayName}
                            email={u.email}
                            avatarUrl={u.avatarUrl}
                            onClick={() => setPreviewUser(u)}
                          />
                        </td>
                        <td>
                          <Link to={`/users/${u.id}`} className="tableCellTitle">
                            {u.displayName || '—'}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/users/${u.id}`} className="tableLink">
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
                              disabled={isDeleting}
                              onClick={() => setEditingUser(u)}
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              className="btn btnIcon btnDanger btnSm"
                              disabled={isSelf || isDeleting}
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

      <AvatarPreviewModal user={previewUser} onClose={() => setPreviewUser(null)} />

      <ConfirmModal
        open={Boolean(deleteModal)}
        title={deleteModal?.title ?? ''}
        message={deleteModal?.message ?? ''}
        confirmLabel={deleteModal?.confirmLabel}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </>
  )
}
