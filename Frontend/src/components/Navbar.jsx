import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ cartCount, user, onLogout, theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive   = (path) => location.pathname === path
  const isCustomer = user?.role === 'CUSTOMER'
  const isBusiness = user?.role === 'BUSINESS'
  const isAdmin    = user?.role === 'ADMIN'
  const isDark     = theme === 'dark'

  const roleBadgeColor = isAdmin    ? '#EF4444'
                       : isBusiness ? '#FFB700'
                       : 'var(--primary)'
  const roleBadgeBg   = isAdmin    ? 'rgba(239,68,68,0.12)'
                       : isBusiness ? 'rgba(255,183,0,0.12)'
                       : 'rgba(255,77,0,0.12)'

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'all 0.3s ease',
    padding: scrolled ? '8px 0' : '12px 0',
    background: scrolled ? (isDark ? 'rgba(10,10,10,0.94)' : 'rgba(245,245,240,0.94)') : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid var(--border)' : 'none',
  }

  const linkStyle = (active) => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: active ? 'var(--primary)' : 'var(--text2)',
    background: active ? 'rgba(255,77,0,0.1)' : 'transparent',
    transition: 'all 0.2s', textDecoration: 'none', display: 'block',
  })

  const adminLinkStyle = (active) => ({
    ...linkStyle(active),
    color: active ? '#EF4444' : 'var(--text2)',
    background: active ? 'rgba(239,68,68,0.1)' : 'transparent',
  })

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

        {/* ── LOGO ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo_nomzee.png" alt="NOMZEE"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            NOMZEE
          </span>
        </Link>

        {/* ── CENTER LINKS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/"     style={linkStyle(isActive('/'))}>Home</Link>
          <Link to="/menu" style={linkStyle(isActive('/menu'))}>Menu</Link>
          {isCustomer && <Link to="/orders"    style={linkStyle(isActive('/orders'))}>Orders</Link>}
          {isBusiness && <Link to="/dashboard" style={linkStyle(isActive('/dashboard'))}>Dashboard</Link>}
          {isAdmin    && <Link to="/admin"      style={adminLinkStyle(isActive('/admin'))}>⚙ Admin</Link>}
        </div>

        {/* ── RIGHT ACTIONS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* ── THEME TOGGLE ── */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 52, height: 28, borderRadius: 14,
              background: isDark ? 'var(--surface2)' : '#E0E0E0',
              border: '1.5px solid var(--border)',
              position: 'relative', cursor: 'pointer',
              transition: 'all 0.3s', flexShrink: 0,
              display: 'flex', alignItems: 'center', padding: '0 4px',
            }}
          >
            {/* Track icons */}
            <span style={{ position: 'absolute', left: 5, fontSize: 12, opacity: isDark ? 0.4 : 1, transition: 'opacity 0.3s' }}>☀️</span>
            <span style={{ position: 'absolute', right: 5, fontSize: 12, opacity: isDark ? 1 : 0.4, transition: 'opacity 0.3s' }}>🌙</span>
            {/* Thumb */}
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: isDark ? 'var(--primary)' : '#555555',
              position: 'absolute',
              left: isDark ? 26 : 4,
              transition: 'all 0.3s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}/>
          </button>

          {user ? (
            <>
              {/* Cart — CUSTOMER only */}
              {isCustomer && (
                <Link to="/cart" style={{
                  position: 'relative', width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 11, color: 'var(--text2)', transition: 'all 0.2s',
                  textDecoration: 'none',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </Link>
              )}

              {/* User avatar + dropdown */}
              <div style={{ position: 'relative' }} className="nav-user-wrap">
                <div style={{
                  width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${roleBadgeColor}, ${isDark ? '#333' : '#ddd'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, color: 'white', transition: 'all 0.2s',
                }}>
                  {isAdmin ? '⚙' : (user.name?.charAt(0)?.toUpperCase() || 'U')}
                </div>

                <div style={{
                  display: 'none', position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: 10, minWidth: 220,
                  boxShadow: 'var(--card-shadow)', zIndex: 200,
                }} className="nav-dropdown">
                  {/* User info */}
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{user.name}</div>
                    <span style={{
                      display: 'inline-block', background: roleBadgeBg, color: roleBadgeColor,
                      border: `1px solid ${roleBadgeColor}33`,
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 6,
                    }}>
                      {user.role}
                    </span>
                  </div>

                  {isCustomer && (
                    <Link to="/cart" style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:9, fontSize:14, color:'var(--text2)', textDecoration:'none', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >🛒 My Cart</Link>
                  )}
                  {isCustomer && (
                    <Link to="/orders" style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:9, fontSize:14, color:'var(--text2)', textDecoration:'none', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >📦 My Orders</Link>
                  )}
                  {isBusiness && (
                    <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:9, fontSize:14, color:'var(--text2)', textDecoration:'none', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >🏪 My Dashboard</Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:9, fontSize:14, color:'#EF4444', textDecoration:'none', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >⚙ Admin Panel</Link>
                  )}

                  <div style={{ height:1, background:'var(--border)', margin:'6px 0' }}/>

                  {/* Theme toggle inside dropdown too */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px' }}>
                    <span style={{ fontSize:14, color:'var(--text2)' }}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                    <button onClick={onToggleTheme} style={{
                      width:44, height:24, borderRadius:12,
                      background: isDark ? 'var(--primary)' : '#D0D0D0',
                      border:'none', cursor:'pointer', position:'relative', transition:'all 0.3s',
                    }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: isDark ? 22 : 3, transition:'left 0.3s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                    </button>
                  </div>

                  <div style={{ height:1, background:'var(--border)', margin:'6px 0' }}/>

                  <button onClick={onLogout} style={{
                    display:'flex', alignItems:'center', gap:8, width:'100%',
                    padding:'9px 12px', borderRadius:9, fontSize:14,
                    color:'#EF4444', background:'none', border:'none',
                    cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'background 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-ghost"   style={{ padding:'9px 18px', fontSize:14 }}>Sign In</Link>
              <Link to="/register" className="btn-primary" style={{ padding:'9px 18px', fontSize:14 }}>Get Started</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .nav-user-wrap:hover .nav-dropdown { display:block !important; animation:fadeUp 0.2s ease; }
        .nav-user-wrap:hover > div:first-child { box-shadow:0 4px 16px rgba(255,77,0,0.25); transform:scale(1.05); }
      `}</style>
    </nav>
  )
}
