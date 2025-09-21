import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SITCONLogo from '@/assets/img/SITCON.svg'
import { api } from '@/lib/api'
import { useI18n } from '@/i18n/strings'

export default function Nav() {
  const { pathname } = useLocation()
  const { t, locale } = useI18n(pathname)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const session = await api.auth.getSession()
        if (mounted) setUser(session?.user || null)
      } catch {
        if (mounted) setUser(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  const signOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    await api.auth.signOut()
  }

  const isAdmin = (u: any) => {
    const roles: string[] = Array.isArray(u?.role) ? u.role : (typeof u?.role === 'string' ? [u.role] : [])
    return roles.includes('admin') || roles.includes('super-admin')
  }

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div>
        <Link to={locale === 'zh-Hant' ? '/' : `/${locale}/`}><img src={SITCONLogo} alt="SITCON Logo" /></Link>
        <div className="right">
          <div id="auth-menu">
            {!user && <Link to={locale === 'zh-Hant' ? '/login' : `/${locale}/login`} id="login-link">{t('login_title')}</Link>}
            {user && (
              <div id="user-menu" style={{ display: 'flex' }}>
                <span id="user-name">{user.name || user.email || (locale === 'en' ? 'User' : '使用者')}</span>
                {isAdmin(user) && <Link to="/admin" id="admin-link">{t('admin')}</Link>}
                <a href="#" id="logout-link" onClick={signOut}>{locale === 'en' ? 'Sign out' : '登出'}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
