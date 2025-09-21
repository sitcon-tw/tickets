import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function Welcome() {
  const [view, setView] = useState<'none' | 'registered' | 'referral' | 'invitation' | 'default'>('none')
  const [referralCode, setReferralCode] = useState('載入中...')

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const ref = sp.get('ref')
    const invite = sp.get('invite')

    ;(async () => {
      try {
        const session = await api.auth.getSession()
        if (session?.user) {
          // has session, check registrations
          const regs = await api.registrations.getUserRegistrations()
          if (regs?.success && regs.data?.length > 0) {
            setView('registered')
            try {
              const rc = await api.referrals.getUserCode()
              if (rc?.success && rc.data?.code) setReferralCode(rc.data.code)
              else setReferralCode('載入失敗')
            } catch {
              setReferralCode('載入失敗')
            }
            return
          }
          if (invite) {
            sessionStorage.setItem('invitationCode', invite)
            setView('invitation')
            return
          }
          if (ref) {
            sessionStorage.setItem('referralCode', ref)
            setView('referral')
            return
          }
          setView('default')
        } else {
          if (ref) {
            sessionStorage.setItem('referralCode', ref)
            setView('referral')
          } else if (invite) {
            sessionStorage.setItem('invitationCode', invite)
            setView('invitation')
          } else {
            setView('none')
          }
        }
      } catch (e) {
        setView('none')
      }
    })()
  }, [])

  const copyReferral = async () => {
    if (referralCode && referralCode !== '載入中...' && referralCode !== '載入失敗') {
      await navigator.clipboard.writeText(referralCode)
      alert('推薦碼已複製到剪貼簿！')
    }
  }

  const goInviteRegister = (e: React.MouseEvent) => {
    e.preventDefault()
    const invite = sessionStorage.getItem('invitationCode')
    const params = new URLSearchParams()
    if (invite) params.set('invite', invite)
    window.location.href = `/form/?${params.toString()}`
  }

  return (
    <>
      {view === 'registered' && (
        <section className="welcome-section" style={{ background: 'var(--color-gray-800)', padding: '2rem', margin: '1rem', textAlign: 'center' }}>
          <h2>你已完成報名！</h2>
          <p>歡迎使用以下優惠碼邀請朋友一起參加：</p>
          <div className="code" onClick={copyReferral} style={{ background: 'var(--color-gray-700)', padding: '.5rem', maxWidth: '10rem', margin: '1rem auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div id="referral-code" style={{ textAlign: 'center', flex: 1, fontWeight: 'bold' }}>{referralCode}</div>
            <span style={{ opacity: .7 }}>⧉</span>
          </div>
        </section>
      )}
      {view === 'referral' && (
        <section className="welcome-section" style={{ background: 'var(--color-gray-800)', padding: '2rem', margin: '1rem', textAlign: 'center' }}>
          <h2>邀請你一起參加 SITCON！</h2>
          <p>累積三人一起報名即可獲得一張柴柴簽名照。</p>
        </section>
      )}
      {view === 'invitation' && (
        <section className="welcome-section" style={{ background: 'var(--color-gray-800)', padding: '2rem', margin: '1rem', textAlign: 'center' }}>
          <h2>你收到了一張講者邀請票！</h2>
          <a className="button" href="#" onClick={goInviteRegister}>立即報名</a>
        </section>
      )}
      {/* default view intentionally empty per Astro behavior */}
      <h2 id="select" style={{ fontSize: '1rem', margin: '2rem 0', textAlign: 'center', fontWeight: 'normal', animation: 'blink 1s infinite linear alternate', opacity: .8 }}>請選擇你要的票種</h2>
    </>
  )
}
