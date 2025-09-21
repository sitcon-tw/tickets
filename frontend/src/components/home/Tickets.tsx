import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function Tickets() {
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => api.events.list() })
  const eventId = useMemo(() => events?.data?.[0]?.id as string | undefined, [events])
  const eventName = useMemo(() => events?.data?.[0]?.name as string | undefined, [events])
  const { data: tickets } = useQuery({
    queryKey: ['tickets', eventId],
    queryFn: () => api.events.getTickets(eventId!),
    enabled: !!eventId,
  })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const animationRef = useRef<HTMLDivElement>(null)
  const confirmContainerRef = useRef<HTMLDivElement>(null)
  const ticketConfirmRef = useRef<HTMLDivElement>(null)
  const hiddenElRef = useRef<HTMLElement | null>(null)
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({ display: 'none' })

  const onSelect = (t: any, el: HTMLElement) => {
    setSelected(t)
    setConfirmOpen(true)
    sessionStorage.setItem('selectedTicketId', t.id)
    sessionStorage.setItem('selectedTicketName', t.name || '')
    sessionStorage.setItem('selectedEventName', eventName || '')

    // Start animation from clicked ticket
    hiddenElRef.current = el
    // Hide original card
    el.style.visibility = 'hidden'

    // Initialize animation position/transform to match source card
    const rect = el.getBoundingClientRect()
    const transform = getComputedStyle(el).transform
    setAnimStyle({
      display: 'block',
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      transform: transform === 'none' ? undefined : transform,
      transition: 'none',
      zIndex: 500,
      width: '100%'
    })

    // Defer to next frame to ensure confirm DOM is mounted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsConfirming(true)
        const target = ticketConfirmRef.current
        if (target) {
          const tRect = target.getBoundingClientRect()
          const tTransform = getComputedStyle(target).transform
          // Enable transition via CSS selector (.confirming + #ticketAnimation)
          setAnimStyle(s => ({
            ...s,
            top: `${tRect.top}px`,
            left: `${tRect.left}px`,
            transform: tTransform === 'none' ? undefined : tTransform,
          }))
          // After animation, hide animation layer and show confirm ticket
          setTimeout(() => {
            setAnimStyle(s => ({ ...s, display: 'none' }))
            // Make the confirm ticket visible
            if (ticketConfirmRef.current) {
              ticketConfirmRef.current.style.visibility = 'visible'
              ticketConfirmRef.current.style.pointerEvents = 'auto'
            }
          }, 300)
        }
      })
    })
  }

  const confirm = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selected) return
    const params = new URLSearchParams()
    params.set('ticket', selected.id)
    if (eventName) params.set('eventName', eventName)
    if (selected.name) params.set('ticketType', selected.name)
    const invite = sessionStorage.getItem('invitationCode')
    if (invite) params.set('invite', invite)
    const ref = sessionStorage.getItem('referralCode')
    if (ref) params.set('ref', ref)
    window.location.href = `/form/?${params.toString()}`
  }

  const closeConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsConfirming(false)
    setConfirmOpen(false)
    // restore source card visibility
    if (hiddenElRef.current) {
      hiddenElRef.current.style.visibility = 'visible'
      hiddenElRef.current = null
    }
    // hide animation layer
    setAnimStyle(s => ({ ...s, display: 'none' }))
  }

  return (
    <div>
      <div className="tickets-container">
        {tickets?.success && tickets.data.map((t: any, idx: number) => (
          <div
            className="ticket"
            key={t.id}
            onClick={(e) => { if (!t.isSoldOut && t.isOnSale) onSelect(t, e.currentTarget as HTMLElement) }}
            style={{ transform: idx % 2 ? 'rotate(-1.17deg)' : 'rotate(1.17deg)', opacity: t.isSoldOut ? .6 : 1 }}
          >
            <h3>{t.name}</h3>
            <p>報名時間：{t.saleStart ? new Date(t.saleStart).toLocaleDateString() : 'TBD'} - {t.saleEnd ? new Date(t.saleEnd).toLocaleDateString() : 'TBD'}</p>
            <p className="remain">剩餘 {t.available} / {t.available + ((t.quantity ?? 0) - t.available)}</p>
          </div>
        ))}
      </div>

      {confirmOpen && selected && (
        <>
          <div
            ref={confirmContainerRef}
            className={`confirm ${isConfirming ? 'confirming' : ''}`}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}
          >
            <div className="about" style={{ background: 'var(--color-gray-800)', padding: '1.5rem' }}>
              <div ref={ticketConfirmRef} className="ticket ticketConfirm" style={{ border: '3px solid var(--color-gray-500)', padding: '1rem', maxWidth: 350, visibility: 'hidden', pointerEvents: 'none' }}>
                <h3>{selected.name}</h3>
                <p>報名時間：{selected.saleStart ? new Date(selected.saleStart).toLocaleDateString() : 'TBD'} - {selected.saleEnd ? new Date(selected.saleEnd).toLocaleDateString() : 'TBD'}</p>
                <p className="remain">剩餘 {selected.available} / {selected.available + ((selected.quantity ?? 0) - selected.available)}</p>
              </div>
              <a className="button" href="#" onClick={confirm} style={{ display: 'block', marginTop: '2rem' }}>確認報名</a>
              <a id="close" className="button" href="#" onClick={closeConfirm} style={{ display: 'block', marginTop: '1rem' }}>關閉</a>
            </div>
          </div>
          <div id="ticketAnimation" ref={animationRef} style={animStyle}>
            <div className="ticket" style={{ border: '3px solid var(--color-gray-500)', padding: '1rem', maxWidth: 350, background: 'var(--color-gray-800)' }}>
              <h3>{selected.name}</h3>
              <p>報名時間：{selected.saleStart ? new Date(selected.saleStart).toLocaleDateString() : 'TBD'} - {selected.saleEnd ? new Date(selected.saleEnd).toLocaleDateString() : 'TBD'}</p>
              <p className="remain">剩餘 {selected.available} / {selected.available + ((selected.quantity ?? 0) - selected.available)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
