import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Dashboard() {
  const { data } = useQuery({
    queryKey: ['admin','dashboard'],
    queryFn: () => api.admin.analytics.getDashboard(),
  }) as { data?: any }

  const stats = data?.data || {}

  return (
    <div className="dashboard">
      <h1>總覽</h1>
      <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem'}}>
        <div className="stat-card" style={cardStyle}>
          <h3>總票券數</h3>
          <div className="stat-number" style={numStyle}>{stats.totalTickets ?? '—'}</div>
          <div className="stat-label">tickets</div>
        </div>
        <div className="stat-card" style={cardStyle}>
          <h3>已售出</h3>
          <div className="stat-number" style={numStyle}>{stats.soldTickets ?? '—'}</div>
          <div className="stat-label">tickets</div>
        </div>
        <div className="stat-card" style={cardStyle}>
          <h3>剩餘票數</h3>
          <div className="stat-number" style={numStyle}>{stats.remainingTickets ?? '—'}</div>
          <div className="stat-label">tickets</div>
        </div>
        <div className="stat-card" style={cardStyle}>
          <h3>銷售率</h3>
          <div className="stat-number" style={numStyle}>{(stats.totalTickets>0 && stats.soldTickets>=0) ? `${((stats.soldTickets / stats.totalTickets) * 100).toFixed(1)}%` : '—'}</div>
          <div className="stat-label">completion</div>
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 10,
  padding: '1rem',
}
const numStyle: React.CSSProperties = { fontSize: '2rem' }
