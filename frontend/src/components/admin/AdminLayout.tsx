import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import AdminNav from './AdminNav'
import '@/styles/admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const session = await api.auth.getSession()
        const role = session?.user?.role
        const roles = Array.isArray(role)
          ? role
          : (typeof role === 'string' ? role.split(',').map(r => r.trim()).filter(Boolean) : [])
        const rolesLc = roles.map(r => r.toLowerCase())
        const isAdmin = rolesLc.includes('admin') || rolesLc.includes('super-admin')
        if (!isAdmin) {
          navigate('/login')
          return
        }
        // Non-blocking ping to admin API for diagnostics, but don't redirect on failure
        api.admin.analytics.getDashboard().catch((e: any) => {
          if (!mounted) return
          const msg = String(e?.message || e)
          setError(`Admin API ping failed: ${msg}`)
        })
        if (mounted) setAuthorized(true)
      } catch {
        navigate('/login')
      } finally {
        if (mounted) setChecked(true)
      }
    })()
    return () => { mounted = false }
  }, [navigate])

  if (!checked) return null
  if (!authorized) return null

  return (
    <div className="admin-shell">
      <AdminNav />
      <main>
        {error && (
          <div style={{ background: 'rgba(255,0,0,.1)', border: '1px solid rgba(255,0,0,.3)', padding: '0.75rem 1rem', borderRadius: 8, margin: '1rem' }}>
            {error}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
