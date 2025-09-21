import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Invites() {
  const [search, setSearch] = useState('')
  const invitesQ = useQuery({ queryKey: ['admin','invites'], queryFn: () => api.admin.invitationCodes.list({ limit: '500' }) }) as { data?: any }
  const codes = invitesQ.data?.data || []

  const grouped = useMemo(() => {
    const groups: Record<string, any> = {}
    for (const c of codes) {
      const type = c.type || c.name || 'Default'
      if (!groups[type]) groups[type] = { id: type, name: type, createdAt: c.createdAt, codes: [] }
      groups[type].codes.push({
        id: c.id,
        code: c.code,
        usedCount: c.usedCount || 0,
        usageLimit: c.usageLimit || 1,
        usedBy: c.usedBy,
        active: c.isActive !== false,
      })
    }
    return Object.values(groups)
  }, [codes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return grouped
    return grouped.filter((g:any)=> g.name.toLowerCase().includes(q) || g.codes.some((c:any)=> c.code.toLowerCase().includes(q)))
  }, [grouped, search])

  return (
    <div>
      <h1>邀請碼</h1>
      <section className="toolbar admin-toolbar">
        <button type="button">➕ 新增邀請碼組</button>
        <button type="button" className="secondary">⬇️ 匯出 CSV</button>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={'🔍搜尋名稱 / 代碼'} />
      </section>
      <section className="types-wrapper">
        {!codes.length && <div className="loading">載入中...</div>}
        {codes.length>0 && (
          <table className="typesTable admin-table">
            <thead>
              <tr>
                <th>名稱</th>
                <th>總數</th>
                <th>已用</th>
                <th>剩餘</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g:any)=>{
                const total = g.codes.length
                const used = g.codes.reduce((s:number,c:any)=> s + (c.usedCount>0?1:0), 0)
                const remain = total - used
                return (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>{total}</td>
                    <td>{used}</td>
                    <td>{remain}</td>
                    <td>{g.createdAt ? new Date(g.createdAt).toLocaleString() : ''}</td>
                    <td><button>查看代碼</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
