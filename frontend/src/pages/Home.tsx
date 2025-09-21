import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/home/Header'
import Welcome from '@/components/home/Welcome'
import Tickets from '@/components/home/Tickets'
import Info from '@/components/home/Info'

export default function Home() {
  const navigate = useNavigate()
  // Capture ?ref= and ?invite=, stash in sessionStorage, then clean URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const ref = sp.get('ref')
    const invite = sp.get('invite')
    if (ref) sessionStorage.setItem('referralCode', ref)
    if (invite) sessionStorage.setItem('invitationCode', invite)
    if (ref || invite) {
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Sections now handled by Header, Welcome, Tickets, Info

  return (
    <section>
      <Header />
      <Welcome />
      <Tickets />
      <Info />
    </section>
  )
}
