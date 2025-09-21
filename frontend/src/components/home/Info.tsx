import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Vite can import raw text with ?raw
import intro from '@/pages/markdown/intro.md?raw'
import faq from '@/pages/markdown/faq.md?raw'

// Ticket markdowns
import ticketStudent from '@/pages/markdown/tickets/學生票.md?raw'
import ticketGeneral from '@/pages/markdown/tickets/普通票.md?raw'
import ticketLong from '@/pages/markdown/tickets/遠道而來票.md?raw'
import ticketInvite from '@/pages/markdown/tickets/邀請票.md?raw'
import ticketOpenSource from '@/pages/markdown/tickets/開源貢獻票.md?raw'

export default function Info() {
  const tickets = [
    ['學生票', ticketStudent],
    ['一般票', ticketGeneral],
    ['遠道而來票', ticketLong],
    ['邀請票', ticketInvite],
    ['開源貢獻票', ticketOpenSource],
  ] as const

  return (
    <section className="info content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
      <h2>票種資訊</h2>
      {tickets.map(([name, md]) => (
        <section key={name}>
          <h3>{name}</h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </section>
      ))}
      <h2>FAQ</h2>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{faq}</ReactMarkdown>
    </section>
  )
}
