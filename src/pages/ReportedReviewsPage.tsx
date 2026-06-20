import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import { api } from '../lib/api'

type ReportedReview = {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  instructorId: string
  authorUserId: string
  authorName?: string | null
  reportCount: number
  lastReportedAt: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReportedReviewsPage() {
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['admin', 'reviews', 'reported'],
    queryFn: async () =>
      (await api.get<{ data: ReportedReview[] }>('/admin/reviews/reported')).data.data,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/reviews/${id}/remove`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'reviews', 'reported'] }),
  })

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Review flagged content and remove reviews that violate community guidelines."
      />

      <DataPanel
        title="Reported reviews"
        toolbar={q.data ? <span className="pill pillDanger">{q.data.length} flagged</span> : null}
      >
        {q.isLoading ? <LoadingState /> : null}
        {q.isError ? (
          <ErrorBanner message="Failed to load reported reviews. The backend endpoint may not be available yet." />
        ) : null}

        {q.data && q.data.length === 0 ? (
          <EmptyState
            title="Nothing to moderate"
            description="No reviews have been reported. That's a good sign."
          />
        ) : null}

        {q.data && q.data.length > 0 ? (
          <div>
            {q.data.map((r) => (
              <article key={r.id} className="reviewCard">
                <div className="reviewCardHeader">
                  <div className="row">
                    <span className="reviewStars">★ {r.rating}</span>
                    <span className="pill pillDanger">
                      {r.reportCount} report{r.reportCount === 1 ? '' : 's'}
                    </span>
                    <span className="pill">{formatDate(r.createdAt)}</span>
                  </div>
                  <button
                    className="btn btnDanger btnSm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(r.id)}
                  >
                    {remove.isPending ? 'Removing…' : 'Remove review'}
                  </button>
                </div>

                <p className="reviewComment">
                  {r.comment || <em style={{ color: 'var(--muted)' }}>No comment provided</em>}
                </p>

                <div className="reviewMeta">
                  <span>Instructor: {r.instructorId.slice(0, 8)}…</span>
                  <span>Author: {r.authorName || r.authorUserId.slice(0, 8) + '…'}</span>
                  <span>Last report: {formatDate(r.lastReportedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </DataPanel>
    </>
  )
}
