import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import { api } from '../lib/api'
import type { AdminUserListItem, Paginated } from '../lib/types'

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

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit = Number(searchParams.get('limit') ?? '20') || 20
  const [localLimit, setLocalLimit] = useState(String(limit))

  const q = useQuery({
    queryKey: ['admin', 'users', { page, limit }],
    queryFn: async () =>
      (await api.get<Paginated<AdminUserListItem>>('/admin/users', { params: { page, limit } }))
        .data,
  })

  const pagination = useMemo(() => {
    const pages = q.data?.meta.pages ?? 1
    return { pages, canPrev: page > 1, canNext: page < pages }
  }, [q.data, page])

  return (
    <>
      <PageHeader
        title="Users"
        description="Browse and manage registered accounts across the platform."
      />

      <DataPanel
        title="All users"
        toolbar={
          <>
            {q.data ? (
              <span className="pill">{q.data.meta.total.toLocaleString()} total</span>
            ) : null}
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault()
                const nextLimit = Number(localLimit) || 20
                setSearchParams({ page: '1', limit: String(nextLimit) })
              }}
            >
              <select className="input" style={{ width: 'auto' }} value={localLimit} onChange={(e) => setLocalLimit(e.target.value)}>
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
              <button className="btn btnSm" type="submit">
                Apply
              </button>
            </form>
          </>
        }
      >
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorBanner message="Failed to load users." /> : null}

        {q.data && q.data.data.length === 0 ? (
          <EmptyState title="No users found" description="There are no users in the system yet." />
        ) : null}

        {q.data && q.data.data.length > 0 ? (
          <>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.data.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/users/${u.id}`} className="tableCellTitle" style={{ display: 'block' }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="btn btnSm"
                disabled={!pagination.canPrev}
                onClick={() => setSearchParams({ page: String(page - 1), limit: String(limit) })}
              >
                ← Previous
              </button>
              <span className="paginationInfo">
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn btnSm"
                disabled={!pagination.canNext}
                onClick={() => setSearchParams({ page: String(page + 1), limit: String(limit) })}
              >
                Next →
              </button>
            </div>
          </>
        ) : null}
      </DataPanel>
    </>
  )
}
