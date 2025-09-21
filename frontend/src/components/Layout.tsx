import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import '@/styles/global.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Nav />
      <main className="container">
        {children}
      </main>
      <Footer />
    </div>
  )
}
