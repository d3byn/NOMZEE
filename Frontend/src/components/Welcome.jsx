import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STATS = [
  { value: '500+', label: 'Restaurants' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '30 min', label: 'Avg Delivery' },
  { value: '4.8★', label: 'App Rating' },
]

export default function Welcome({ user, foods }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate('/menu')
  }

  // "What We Offer" shows real food from DB, empty if none
  const featuredFoods = foods.slice(0, 6)

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 0 80px', overflow: 'hidden' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,77,0,0.10) 0%,transparent 70%)', top: -120, left: -120, filter: 'blur(60px)', animation: 'pulse 8s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', background: 'radial-gradient(circle,rgba(255,183,0,0.06) 0%,transparent 70%)', width: 400, height: 400, borderRadius: '50%', bottom: 0, right: '5%', filter: 'blur(60px)', animation: 'pulse 6s ease-in-out 2s infinite' }}/>
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px' }}/>
        </div>

        <div className="page-container" style={{ position: 'relative', zIndex: 2, maxWidth: 700 }}>
          {/* Headline */}
          <h1 className="animate-fadeUp" style={{ fontSize: 'clamp(44px,6.5vw,76px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 18, animationDelay: '0.1s' }}>
            Craving something<br />
            <span style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              delicious?
            </span>
          </h1>

          <p className="animate-fadeUp" style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 36, maxWidth: 460, animationDelay: '0.15s' }}>
            Order from top restaurants near you. Fast, fresh, and always on time.
          </p>

          {/* Search bar */}
          <form className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 7, maxWidth: 580, marginBottom: 36, transition: 'all 0.3s', animationDelay: '0.2s' }}
            onSubmit={handleSearch}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', color: 'var(--text2)', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Kolkata, WB
            </div>
            <div style={{ width: 1, height: 26, background: 'var(--border)', flexShrink: 0 }}/>
            <input
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 14px', fontSize: 15, color: 'var(--text)', minWidth: 0 }}
              placeholder="Search for restaurant, food..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" style={{ width: 42, height: 42, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </form>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '36px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="page-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE OFFER ── */}
      <section style={{ padding: '72px 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>What we offer</h2>
            <p style={{ color: 'var(--text2)', fontSize: 16 }}>Fresh picks from our restaurant partners</p>
          </div>

          {featuredFoods.length === 0 ? (
            /* Empty state — no food in DB yet */
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 18 }}>🍽️</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>No items listed yet</h3>
              <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 28 }}>
                Restaurant partners haven't added their menu yet.<br />Check back soon!
              </p>
              {!user && (
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Register as a Restaurant
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
              {featuredFoods.map(food => (
                <FeaturedCard key={food.id} food={food} onClick={() => navigate('/menu')} />
              ))}
            </div>
          )}

          {featuredFoods.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <button className="btn-primary" onClick={() => navigate('/menu')}>
                View Full Menu →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={{ padding: '72px 0' }}>
          <div className="page-container">
            <div style={{ background: 'linear-gradient(135deg,var(--surface) 0%,rgba(255,77,0,0.06) 100%)', border: '1px solid rgba(255,77,0,0.18)', borderRadius: 24, padding: '52px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'radial-gradient(circle,rgba(255,77,0,0.08) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}/>
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Ready to order?</h2>
                <p style={{ color: 'var(--text2)', fontSize: 16 }}>Join thousands of happy customers. Sign up in seconds.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('/register')}>Create Free Account →</button>
                <button className="btn-ghost" onClick={() => navigate('/menu')}>Browse Menu</button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function FeaturedCard({ food, onClick }) {
  const emojis = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤']

  // Same logic as MenuPage — check localStorage first for uploaded image
  const uploadedImg = (() => {
    try {
      const store = JSON.parse(localStorage.getItem('nomzee_food_images') || '{}')
      return store[String(food.id)] || store[String(food.name).toLowerCase().trim()] || null
    } catch { return null }
  })()

  const fallbackEmoji = food.imageUrl?.length <= 2 ? food.imageUrl : emojis[(food.id ?? 0) % emojis.length]

  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(255,77,0,0.25)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* 1:1 image area */}
      <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
        {uploadedImg
          ? <img src={uploadedImg} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : fallbackEmoji
        }
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{food.name}</div>
        <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 10 }}>{food.restaurant?.name || ''}</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>₹{food.price}</div>
      </div>
    </div>
  )
}
