import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div className="page-container" style={{ padding: '48px 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
        <div>
          {/* Logo — uses real image */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <img
              src="/logo_nomzee.png"
              alt="NOMZEE logo"
              style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }}
            />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>NOMZEE</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>
            Delivering happiness, one meal at a time. Order from the best restaurants near you.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 60 }}>
          {[
            { title: 'App',     links: [['Home', '/'], ['Menu', '/menu'], ['Orders', '/orders']] },
            { title: 'Account', links: [['Sign In', '/login'], ['Register', '/register']] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 14 }}>{col.title}</div>
              {col.links.map(([label, to]) => (
                <Link key={label} to={to} style={{ display: 'block', color: 'var(--text2)', fontSize: 14, marginBottom: 10, transition: 'color 0.2s', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text2)'}
                >{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Copyright — with LinkedIn links */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '18px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
        © 2026 NOMZEE. Made by{' '}
        <a
          href="https://www.linkedin.com/in/d3bayansarkar/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.75'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >Debayan</a>
        {' & '}
        <a
          href="https://www.linkedin.com/in/anuja-ghosal-10b10b2b2/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.75'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >Anuja</a>
      </div>
    </footer>
  )
}
