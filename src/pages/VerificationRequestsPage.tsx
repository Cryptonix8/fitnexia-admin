import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import { api } from '../lib/api'
import type { VerificationRequest } from '../lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VerificationRequestsPage() {
  const qc = useQueryClient()
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  const q = useQuery({
    queryKey: ['admin', 'verification-requests'],
    queryFn: async () =>
      (await api.get<{ data: VerificationRequest[] }>('/admin/verification-requests')).data.data,
  })

  const approve = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/admin/verification-requests/${id}/approve`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  })

  const reject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      (await api.post(`/admin/verification-requests/${id}/reject`, { notes })).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  })

  return (
    <>
      <PageHeader
        title="Verification"
        description="Review pending instructor and institution profile verification requests."
      />

      <DataPanel
        title="Pending requests"
        toolbar={q.data ? <span className="pill">{q.data.length} pending</span> : null}
      >
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? <ErrorBanner message="Failed to load verification queue." /> : null}

        {q.data && q.data.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="No profiles are waiting for verification right now."
          />
        ) : null}

        {q.data && q.data.length > 0 ? (
          <div className="queueList">
            {q.data.map((r) => (
              <div key={r.id} className="queueItem">
                <div className="queueItemMain">
                  <div className="row" style={{ marginBottom: 8 }}>
                    <span className="tableCellTitle">{r.subjectName ?? 'Unknown subject'}</span>
                    <RoleBadge
                      role={r.subjectType === 'instructor' ? 'instructor' : 'institution'}
                    />
                  </div>
                  <div className="tableCellSub">Submitted {formatDate(r.submittedAt)}</div>
                  <div className="tableMeta">
                    {r.subjectType === 'instructor' ? r.instructorId : r.institutionId}
                  </div>
                </div>
                <div className="queueItemActions">
                  <div className="btnGroup">
                    <button
                      className="btn btnPrimary btnSm"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => approve.mutate(r.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btnDanger btnSm"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => reject.mutate({ id: r.id, notes: rejectNotes[r.id] ?? '' })}
                    >
                      Reject
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="Rejection reason (optional)"
                    value={rejectNotes[r.id] ?? ''}
                    onChange={(e) => setRejectNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </DataPanel>
    </>
  )
}
