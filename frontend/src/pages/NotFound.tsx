import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <section style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="content" style={{ textAlign: 'center', maxWidth: 700 }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
        <p style={{ marginBottom: '0.5rem' }}>頁面不存在或已被移動。</p>
        <p style={{ color: 'var(--color-gray-400)', marginBottom: '1rem' }}>您造訪的路徑：<code style={{ color: 'inherit' }}>{pathname}</code></p>
        <Link to="/" className="button">回到首頁</Link>
      </div>
    </section>
  )
}
