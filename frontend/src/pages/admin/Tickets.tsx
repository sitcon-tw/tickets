import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Tickets() {
  const eventsQ = useQuery({ queryKey: ['events'], queryFn: () => api.events.list() }) as { data?: any }
  const currentEventId = eventsQ.data?.[0]?.id

  const ticketsQ = useQuery({
    enabled: !!currentEventId,
    queryKey: ['admin','tickets', currentEventId],
    queryFn: () => api.admin.tickets.list(currentEventId!),
  }) as { data?: any }

  const tickets = ticketsQ.data?.data || []

  return (
    <div>
      <h1>票種管理</h1>
      <section className="ticket-overview">
        <div className="table-container">
          <table className="tickets-table admin-table">
            <thead>
              <tr>
                <th>票種</th>
                <th>開始時間</th>
                <th>結束時間</th>
                <th>狀態</th>
                <th>數量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t:any)=>{
                const now = new Date()
                const start = t.saleStart ? new Date(t.saleStart) : null
                const end = t.saleEnd ? new Date(t.saleEnd) : null
                const onSale = (!start || now >= start) && (!end || now <= end)
                const remain = (t.quantity ?? 0) - (t.soldCount ?? 0)
                return (
                  <tr key={t.id}>
                    <td className="ticket-name"><span className="ticket-label">{t.name}</span></td>
                    <td className="time-cell">{start ? start.toLocaleString() : ''}</td>
                    <td className="time-cell">{end ? end.toLocaleString() : ''}</td>
                    <td className="status-cell"><span className="status-badge">{onSale ? '販售中' : (start && now < start) ? '尚未開始' : '已結束'}</span></td>
                    <td className="quantity"><span className="quantity-value">{remain}</span></td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button className="button" onClick={()=>{/* TODO open modal to edit */}}>編輯</button>
                        <button className="button delete" onClick={()=>{/* TODO delete */}}>刪除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
