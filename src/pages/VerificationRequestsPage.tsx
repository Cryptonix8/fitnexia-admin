import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import DataPanel, { EmptyState, ErrorBanner } from '../components/DataPanel'
import LoadingOverlay from '../components/LoadingOverlay'
import PageHeader from '../components/PageHeader'
import RoleBadge from '../components/RoleBadge'
import { api } from '../lib/api'
import type { VerificationDocument, VerificationRequest } from '../lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const DOC_LABELS: Record<string, string> = {
  dni_front: 'ID — front',
  dni_back: 'ID — back',
  certification: 'Certification',
}

async function openDocument(requestId: string, doc: VerificationDocument) {
  const res = await api.get(
    `/admin/verification-requests/${requestId}/documents/${doc.id}`,
    { responseType: 'blob' },
  )
  const blob = new Blob([res.data], { type: doc.mimeType })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
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
      (await api.post(`/admin/verification-requests/${id}/reject`, { reason: notes })).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  })

  const isBusy = q.isLoading || q.isFetching || approve.isPending || reject.isPending

  return (
    <>
      <LoadingOverlay
        show={isBusy}
        label={
          approve.isPending
            ? 'Approving request…'
            : reject.isPending
              ? 'Rejecting request…'
              : 'Loading verification queue…'
        }
      />

      <PageHeader
        title="Verification"
        description="Review pending instructor and institution verification requests. Documents are private and only visible here."
      />

      <DataPanel
        title="Pending requests"
        toolbar={q.data ? <span className="pill">{q.data.length} pending</span> : null}
      >
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
                  {r.documents && r.documents.length > 0 ? (
                    <div className="docList">
                      {r.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          className="btn btnOutline btnSm"
                          onClick={() => void openDocument(r.id, doc)}
                        >
                          {DOC_LABELS[doc.documentType] ?? doc.documentType}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="tableCellSub">No documents attached</div>
                  )}
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
                      disabled={
                        approve.isPending || reject.isPending || !(rejectNotes[r.id] ?? '').trim()
                      }
                      onClick={() => reject.mutate({ id: r.id, notes: rejectNotes[r.id] ?? '' })}
                    >
                      Reject
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="Rejection reason (required to reject)"
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
