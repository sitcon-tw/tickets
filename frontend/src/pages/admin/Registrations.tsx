import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Registrations() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(20)

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['admin','registrations', { status, search, limit }],
    queryFn: () => api.admin.registrations.list({ status, search, limit: String(limit) }),
  }) as { data?: any, refetch: () => void, isFetching: boolean }

  const regs = data?.data || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return regs.filter((r: any) => {
      if (status && r.status !== status) return false
      if (!q) return true
      return JSON.stringify(r).toLowerCase().includes(q)
    })
  }, [regs, status, search])

  return (
    <div>
      <h1>報名資料</h1>
      <section className="controls">
        <div className="row filters">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={'🔍 搜尋'} />
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">全部狀態</option>
            <option value="confirmed">已確認</option>
            <option value="pending">待處理</option>
            <option value="cancelled">已取消</option>
          </select>
          <select value={limit} onChange={e=>setLimit(Number(e.target.value))} title="Rows per page">
            <option>20</option>
            <option>50</option>
            <option>100</option>
          </select>
          <button type="button" onClick={()=>refetch()}>↻ 重新整理</button>
          <button type="button" className="secondary" onClick={async()=>{
            const res = await api.admin.registrations.export({ format: 'csv' })
            const url = res?.data?.downloadUrl
            if (url) window.open(url, '_blank')
          }}>📝 匯出 CSV</button>
        </div>
      </section>
      <section className="table-wrapper">
        {isFetching && <div className="loading">載入中...</div>}
        {!isFetching && filtered.length === 0 && <div className="empty">沒有資料</div>}
        {!isFetching && filtered.length > 0 && (
          <table className="reg-table admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Status</th>
                <th>Ticket</th>
                <th>Event</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r:any)=> (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="truncate">{r.email || r.formData?.email || ''}</td>
                  <td><span className={`label-pill status-${r.status}`}>{r.status}</span></td>
                  <td>{r.ticket?.name || ''}</td>
                  <td>{r.event?.name || ''}</td>
                  <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
