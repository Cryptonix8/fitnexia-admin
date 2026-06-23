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
    <div>
      <PageHeader title="Institutions" description="Gym SaaS tiers and member usage" />

      <DataPanel>
        {error ? <ErrorBanner message="Could not load institutions." /> : null}
        {isLoading ? <LoadingState label="Loading institutions…" /> : null}

        {!isLoading && data?.data.length === 0 ? (
          <EmptyState title="No institutions" description="Registered gyms will appear here." />
        ) : null}

        {!isLoading && data && data.data.length > 0 ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Owner</th>
                  <th>Members</th>
                  <th>Plan</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.ownerEmail}</td>
                    <td>{row.memberCount}</td>
                    <td>
                      <select
                        className="input"
                        value={row.saasTier}
                        disabled={tierMutation.isPending}
                        onChange={(e) =>
                          tierMutation.mutate({ id: row.id, saasTier: e.target.value })
                        }
                      >
                        {TIERS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{row.verified ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data ? (
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        ) : null}
      </DataPanel>
    </div>
  )
}
