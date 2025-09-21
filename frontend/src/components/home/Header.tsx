export default function Header() {
  return (
    <section style={{ paddingTop: '5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        SITCON 2026 <span style={{ display: 'block', fontSize: '0.8em' }}>報名系統</span>
      </h1>
      <p className="count" style={{ fontSize: '1.2rem' }}>
        已有 <span id="count" style={{ fontWeight: 'bold', fontSize: '1.5em' }}>20</span> 人報名
      </p>
    </section>
  )
}
