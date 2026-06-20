import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DataPanel, { ErrorBanner, LoadingState } from '../components/DataPanel'
import {
  IconBuilding,
  IconCalendar,
  IconDumbbell,
  IconUsers,
} from '../components/icons'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { api } from '../lib/api'

type Metrics = {
  users: number
  classes: number
  confirmedBookings: number
  instructors: number
  institutions: number
}

export default function MetricsPage() {
  const q = useQuery({
    queryKey: ['admin', 'metrics', 'overview'],
    queryFn: async () => (await api.get<Metrics>('/admin/metrics/overview')).data,
  })

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform overview — users, instructors, classes, and bookings at a glance."
      />

      {q.isLoading ? <LoadingState label="Loading metrics…" /> : null}
      {q.isError ? <ErrorBanner message="Could not load metrics. Check your connection and admin access." /> : null}

      {q.data ? (
        <div className="statGrid">
          <StatCard
            label="Total users"
            value={q.data.users}
            icon={<IconUsers />}
            tone="primary"
          />
          <StatCard
            label="Instructors"
            value={q.data.instructors}
            icon={<IconDumbbell />}
            tone="accent"
          />
          <StatCard
            label="Institutions"
            value={q.data.institutions}
            icon={<IconBuilding />}
            tone="warning"
          />
          <StatCard
            label="Active classes"
            value={q.data.classes}
            icon={<IconCalendar />}
            tone="success"
          />
          <StatCard
            label="Confirmed bookings"
            value={q.data.confirmedBookings}
            icon={<IconCalendar />}
            tone="primary"
          />
        </div>
      ) : null}

      <DataPanel title="Quick actions">
        <div style={{ padding: '22px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btnPrimary btnSm" to="/users">
            Manage users
          </Link>
          <Link className="btn btnSm" to="/verification">
            Review verifications
          </Link>
          <Link className="btn btnSm" to="/reviews/reported">
            Moderate reviews
          </Link>
        </div>
      </DataPanel>
    </>
  )
}
