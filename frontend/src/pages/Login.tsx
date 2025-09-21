import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n/strings'

type ViewState = 'login' | 'sent' | 'error'

export default function Login() {
  const { pathname } = useLocation()
  const { t, locale } = useI18n(pathname)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [state, setState] = useState<ViewState>('login')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const ok = await api.auth.sendMagicLink(email)
      if (ok) setState('sent')
      else setState('error')
    } catch (e: any) {
      setError(e?.message || '寄送失敗，請稍後再試。')
      setState('error')
    } finally {
      setLoading(false)
    }
  }

  const sectionClass = useMemo(() => `login-page ${state}`, [state])

  return (
    <section className={sectionClass} style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="login-container" style={{ width: 'min(560px, 90%)' }}>
        <h1 style={{ marginBottom: '1rem' }}>{t('login_title')}</h1>
        <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--color-gray-600)' }}
          />
          <button className="button" disabled={loading} type="submit">
            {loading ? (locale === 'en' ? 'Sending…' : '寄送中…') : t('send_magic_link')}
          </button>
        </form>
      </div>

      <div className="sent-container content" style={{ width: 'min(700px, 90%)', textAlign: 'center' }}>
        <h2>{t('sent_title')}</h2>
        <p>{locale === 'en' ? 'Please check your inbox and click the link to sign in. If it went to spam, mark it as not spam to avoid missing important emails.' : '請檢查您的電子郵件收件匣，並點擊連結以登入。若在垃圾郵件請記得回報為非垃圾郵件，以免錯過後續重要信件。'}</p>
        <button className="button" onClick={() => setState('login')}>{t('retry')}</button>
      </div>

      <div className="error-container content" style={{ width: 'min(700px, 90%)', textAlign: 'center' }}>
        <h2>{locale === 'en' ? 'Error' : '錯誤'}</h2>
        <p>{error || (locale === 'en' ? 'Failed to send. Please try again later.' : '寄送失敗，請稍後再試。')}</p>
        <button className="button" onClick={() => setState('login')}>{t('retry')}</button>
      </div>
    </section>
  )
}
