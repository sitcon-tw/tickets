import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

type Field = {
  id: string
  name: string
  description: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox'
  required?: boolean
  placeholder?: string | null
  options?: Array<string | { value: string; label: string }>|null
}

export default function Form() {
  const navigate = useNavigate()
  const sp = new URLSearchParams(window.location.search)
  const selectedTicketId = sp.get('ticket') || sessionStorage.getItem('selectedTicketId') || ''
  const initialInvite = sp.get('invite') || sessionStorage.getItem('invitationCode') || ''
  const initialRef = sp.get('ref') || sessionStorage.getItem('referralCode') || ''
  const selectedEventName = sessionStorage.getItem('selectedEventName') || sp.get('eventName') || ''
  const selectedTicketName = sessionStorage.getItem('selectedTicketName') || sp.get('ticketType') || ''

  const [invitationCode] = useState(initialInvite)
  const [referralCode] = useState(initialRef)

  // Require ticket selection
  useEffect(() => {
    if (!selectedTicketId) {
      alert('未指定票種，請重新選擇')
      navigate('/')
    }
  }, [navigate, selectedTicketId])

  // Get events and derive first active event id (Astro parity)
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events.list(),
  })
  const eventId = useMemo(() => events?.data?.[0]?.id as string | undefined, [events])

  // Get tickets for event
  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ['tickets', eventId],
    queryFn: () => api.events.getTickets(eventId!),
    enabled: !!eventId,
  })

  const ticket = useMemo(() => {
    return tickets?.data?.find((t: any) => t.id === selectedTicketId)
  }, [tickets, selectedTicketId])

  const [formData, setFormData] = useState<Record<string, any>>({})

  // Prefill email from session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => api.auth.getSession(),
  })
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(fd => ({ ...fd, email: session.user.email }))
    } else if (session === null) {
      // not logged in -> redirect to login
      navigate('/login')
    }
  }, [navigate, session])

  const registration = useMutation({
    mutationFn: async (payload: any) => api.registrations.create(payload),
    onSuccess: () => {
      // Clear temp storage then go success
      sessionStorage.removeItem('selectedTicketId')
      sessionStorage.removeItem('referralCode')
      sessionStorage.removeItem('invitationCode')
      navigate('/success')
    },
  })

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, value: string, checked: boolean, multi: boolean) => {
    setFormData(prev => {
      if (multi) {
        const current = new Set<string>(Array.isArray(prev[name]) ? prev[name] : prev[name] ? [prev[name]] : [])
        if (checked) current.add(value)
        else current.delete(value)
        return { ...prev, [name]: Array.from(current) }
      } else {
        return { ...prev, [name]: checked ? true : false }
      }
    })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !selectedTicketId) {
      alert('表單資料不完整，請重新選擇票種')
      navigate('/')
      return
    }
    registration.mutate({
      eventId,
      ticketId: selectedTicketId,
      formData,
      invitationCode: invitationCode || undefined,
      referralCode: referralCode || undefined,
    })
  }

  if (!selectedTicketId) return null

  return (
    <section>
      <p>
        <a href="/">重新選擇票種</a>
      </p>
      <h1>填寫報名資訊</h1>

      {selectedEventName && selectedTicketName && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-gray-100)', borderRadius: 8 }}>
          <p>
            <strong>活動：</strong>
            <span>{selectedEventName}</span>
          </p>
          <p>
            <strong>票種：</strong>
            <span>{selectedTicketName}</span>
          </p>
        </div>
      )}

      {(loadingEvents || loadingTickets) && <div style={{ padding: '2rem' }}>載入表單中...</div>}

      {ticket && (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Basic fields */}
          <div className="form-group">
            <label htmlFor="name">姓名 *</label>
            <input id="name" name="name" required value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input id="email" type="email" name="email" required value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
          </div>

          {/* Dynamic fields */}
          {(ticket.formFields as Field[] | undefined)?.map((field) => {
            const required = !!field.required
            const mark = required ? ' *' : ''
            const placeholder = field.placeholder || ''
            switch (field.type) {
              case 'text':
              case 'email':
                return (
                  <div className="form-group" key={field.id}>
                    <label htmlFor={field.name}>{field.description}{mark}</label>
                    <input id={field.name} name={field.name} placeholder={placeholder} required={required} type={field.type === 'email' ? 'email' : 'text'} value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} />
                  </div>
                )
              case 'textarea':
                return (
                  <div className="form-group" key={field.id}>
                    <label htmlFor={field.name}>{field.description}{mark}</label>
                    <textarea id={field.name} name={field.name} placeholder={placeholder} rows={3} required={required} value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} />
                  </div>
                )
              case 'select': {
                const opts = (field.options || []) as any[]
                return (
                  <div className="form-group" key={field.id}>
                    <label htmlFor={field.name}>{field.description}{mark}</label>
                    <select id={field.name} name={field.name} required={required} value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)}>
                      <option value="">請選擇...</option>
                      {opts.map((opt, idx) => {
                        const value = typeof opt === 'object' ? opt.value : opt
                        const label = typeof opt === 'object' ? opt.label : opt
                        return <option key={idx} value={value}>{label}</option>
                      })}
                    </select>
                  </div>
                )
              }
              case 'radio': {
                const opts = (field.options || []) as any[]
                return (
                  <div className="form-group" key={field.id}>
                    <fieldset>
                      <legend>{field.description}{mark}</legend>
                      {opts.map((opt, idx) => {
                        const value = typeof opt === 'object' ? opt.value : opt
                        const label = typeof opt === 'object' ? opt.label : opt
                        const checked = formData[field.name] === value
                        return (
                          <label key={idx} style={{ display: 'block' }}>
                            <input type="radio" name={field.name} value={value} required={required && idx === 0} checked={!!checked} onChange={e => handleChange(field.name, value)} /> {label}
                          </label>
                        )
                      })}
                    </fieldset>
                  </div>
                )
              }
              case 'checkbox': {
                const opts = (field.options || []) as any[]
                const multi = opts.length > 0
                if (multi) {
                  const values = new Set<string>(Array.isArray(formData[field.name]) ? formData[field.name] : formData[field.name] ? [formData[field.name]] : [])
                  return (
                    <div className="form-group" key={field.id}>
                      <fieldset>
                        <legend>{field.description}{mark}</legend>
                        {opts.map((opt, idx) => {
                          const value = typeof opt === 'object' ? opt.value : opt
                          const label = typeof opt === 'object' ? opt.label : opt
                          const checked = values.has(value)
                          return (
                            <label key={idx} style={{ display: 'block' }}>
                              <input type="checkbox" name={field.name} value={value} checked={checked} onChange={e => handleCheckboxChange(field.name, value, e.target.checked, true)} /> {label}
                            </label>
                          )
                        })}
                      </fieldset>
                    </div>
                  )
                } else {
                  const checked = !!formData[field.name]
                  return (
                    <div className="form-group" key={field.id}>
                      <label style={{ display: 'block' }}>
                        <input type="checkbox" name={field.name} checked={checked} onChange={e => handleCheckboxChange(field.name, 'true', e.target.checked, false)} /> {field.description}{mark}
                      </label>
                    </div>
                  )
                }
              }
              default:
                return (
                  <div className="form-group" key={field.id}>
                    <label htmlFor={field.name}>{field.description}{mark}</label>
                    <input id={field.name} name={field.name} placeholder={placeholder} required={required} value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} />
                  </div>
                )
            }
          })}

          {/* Codes */}
          {invitationCode ? (
            <div className="form-group">
              <label>邀請碼</label>
              <input name="invitationCode" value={invitationCode} readOnly />
            </div>
          ) : null}
          {referralCode ? (
            <div className="form-group">
              <label>推薦碼</label>
              <input name="referralCode" value={referralCode} readOnly />
            </div>
          ) : null}

          <button className="button" type="submit" disabled={registration.isPending}>提交報名</button>
          {registration.isError && <p style={{ color: 'red' }}>提交失敗，請稍後再試</p>}
        </form>
      )}
    </section>
  )
}
