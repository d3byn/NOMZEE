import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IMG_KEY = 'nomzee_food_images'
const UNAVAIL_KEY = 'nomzee_unavailable_foods'

const getFoodImage = (foodId, foodName) => {
  try {
    const store = JSON.parse(localStorage.getItem(IMG_KEY) || '{}')
    return store[String(foodId)] || store[String(foodName).toLowerCase().trim()] || null
  } catch { return null }
}

export const getUnavailableFoods = () => {
  try { return new Set(JSON.parse(localStorage.getItem(UNAVAIL_KEY) || '[]')) }
  catch { return new Set() }
}

export default function MenuPage({ user, foods, loading, onAddToCart }) {
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(null)
  const [quantities, setQuantities] = useState({})
  const navigate = useNavigate()

  const unavailable = getUnavailableFoods()

  const filtered = foods.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.restaurant?.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (food) => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'CUSTOMER') return
    if (unavailable.has(String(food.id))) return

    const qty = quantities[food.id] || 1
    setAdding(food.id)
    await onAddToCart(food.id, qty)
    // ✅ Reset qty back to 1 after adding so next click adds 1, not accumulated qty
    setQuantities(p => ({ ...p, [food.id]: 1 }))
    setAdding(null)
  }

  const setQty = (id, val) => setQuantities(p => ({ ...p, [id]: Math.max(1, val) }))

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="loader" />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-container page-header-inner">
          <div>
            <h1 className="page-title">Menu</h1>
            <p className="page-subtitle">{filtered.length} item{filtered.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: '28px 24px 80px' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 13, padding: '12px 16px', gap: 10, maxWidth: 480, marginBottom: 32, transition: 'border-color 0.2s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={{ flex: 1, background: 'none', border: 'none', fontSize: 15, color: 'var(--text)' }}
            placeholder="Search food or restaurant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>✕</button>}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🍽️</span>
            <h3>{foods.length === 0 ? 'No menu items yet' : 'No results found'}</h3>
            <p style={{ color: 'var(--text2)' }}>{foods.length === 0 ? "Restaurant partners haven't added their menu yet." : 'Try a different search term'}</p>
            {search && <button className="btn-primary" onClick={() => setSearch('')}>Clear Search</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(256px,1fr))', gap: 18 }}>
            {filtered.map((food, i) => (
              <FoodCard
                key={food.id}
                food={food}
                qty={quantities[food.id] || 1}
                setQty={v => setQty(food.id, v)}
                onAdd={() => handleAdd(food)}
                adding={adding === food.id}
                canAdd={user?.role === 'CUSTOMER'}
                isGuest={!user}
                isBusiness={user?.role === 'BUSINESS'}
                isUnavailable={unavailable.has(String(food.id))}
                delay={i * 0.035}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FoodCard({ food, qty, setQty, onAdd, adding, canAdd, isGuest, isBusiness, isUnavailable, delay }) {
  const fallbackEmojis = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤','🫓','🥘']
  const uploadedImg   = getFoodImage(food.id, food.name)
  const isEmoji       = food.imageUrl && food.imageUrl.length <= 2
  const fallbackEmoji = fallbackEmojis[(food.id ?? 0) % fallbackEmojis.length]

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${isUnavailable ? 'var(--border)' : 'var(--border)'}`, borderRadius: 18, overflow: 'hidden', transition: 'all 0.25s', animation: `fadeUp 0.4s ease ${delay}s both`, opacity: isUnavailable ? 0.55 : 1, position: 'relative' }}
      onMouseEnter={e => { if (!isUnavailable) { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,77,0,0.2)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Unavailable ribbon */}
      {isUnavailable && (
        <div style={{ position: 'absolute', top: 12, left: 0, background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: '0 8px 8px 0', zIndex: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Unavailable
        </div>
      )}

      {/* Image */}
      <div style={{ height: 'auto', aspectRatio: '1/1', background: 'linear-gradient(135deg,var(--bg3),var(--surface2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 68, position: 'relative', overflow: 'hidden' }}>
        {uploadedImg
          ? <img src={uploadedImg} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isUnavailable ? 'grayscale(60%)' : 'none' }} />
          : <span style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))' }}>{isEmoji ? food.imageUrl : fallbackEmoji}</span>
        }
        {food.restaurant?.name && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.65)', color: 'var(--text2)', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
            {food.restaurant.name}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '18px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{food.name}</div>
        {food.description && (
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>{food.description}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>₹{food.price}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>🕐 25-35 min</span>
        </div>

        {/* Action area */}
        {isUnavailable ? (
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
            Currently Unavailable
          </div>
        ) : canAdd ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Qty control */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
              <button onClick={() => setQty(qty - 1)} style={{ width: 32, height: 34, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 17, cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.background = 'var(--border)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >−</button>
              <span style={{ minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 32, height: 34, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 17, cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.background = 'var(--border)'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >+</button>
            </div>
            <button onClick={onAdd} disabled={adding} style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '9px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: adding ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: adding ? 0.75 : 1, fontFamily: "'DM Sans',sans-serif" }}
              onMouseEnter={e => { if (!adding) e.currentTarget.style.background = 'var(--primary-dark)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              {adding
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                : '+ Add'
              }
            </button>
          </div>
        ) : isGuest ? (
          <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', padding: '8px 0' }}>
            <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</a> to order
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
            Listed on menu
          </div>
        )}
      </div>
    </div>
  )
}
