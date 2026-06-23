import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import DataPanel, { EmptyState, ErrorBanner, LoadingState } from '../components/DataPanel'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import { api } from '../lib/api'
import type { Paginated } from '../lib/types'

type AdminInstitution = {
  id: string
  name: string
  saasTier: string
  verified: boolean
  memberCount: number
  ownerEmail: string
  createdAt: string
}

const TIERS = ['basic', 'professional', 'premium', 'enterprise'] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTier(tier: string) {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export default function InstitutionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-institutions', page],
    queryFn: async () => {
      const res = await api.get<Paginated<AdminInstitution>>('/admin/institutions', {
        params: { page, limit },
      })
      return res.data
    },
  })

  const tierMutation = useMutation({
    mutationFn: async ({ id, saasTier }: { id: string; saasTier: string }) => {
      await api.patch(`/admin/institutions/${id}/tier`, { saasTier })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-institutions'] }),
  })

  return (
    <>
      <PageHeader title="Institutions" description="Gym SaaS tiers and member usage" />

      <DataPanel
        title="All institutions"
        toolbar={
          data ? (
            <span className="pill">{data.meta.total.toLocaleString()} institutions</span>
          ) : null
        }
      >
        {error ? <ErrorBanner message="Could not load institutions." /> : null}
        {isLoading ? <LoadingState label="Loading institutions…" /> : null}

        {!isLoading && data?.data.length === 0 ? (
          <EmptyState title="No institutions" description="Registered gyms will appear here." />
        ) : null}

        {!isLoading && data && data.data.length > 0 ? (
          <>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th className="tableColNum">Members</th>
                    <th>Plan</th>
                    <th>Verified</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="tableCellTitle">{row.name}</span>
                      </td>
                      <td>
                        <span className="tableLink">{row.ownerEmail}</span>
                      </td>
                      <td className="tableColNum">
                        <span className="tableNum">{row.memberCount.toLocaleString()}</span>
                      </td>
                      <td>
                        <select
                          className="input tableSelect"
                          value={row.saasTier}
                          disabled={tierMutation.isPending}
                          aria-label={`Plan for ${row.name}`}
                          onChange={(e) =>
                            tierMutation.mutate({ id: row.id, saasTier: e.target.value })
                          }
                        >
                          {TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              {formatTier(tier)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={row.verified ? 'pill pillOk' : 'pill'}>
                          {row.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>{formatDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        ) : null}
      </DataPanel>
    </>
  )
}
