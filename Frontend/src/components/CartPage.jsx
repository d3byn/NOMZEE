import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const DELIVERY_FEE = 49
const TAX_RATE     = 0.05

// Read uploaded food image from localStorage
const getFoodImage = (foodId, foodName) => {
  try {
    const store = JSON.parse(localStorage.getItem('nomzee_food_images') || '{}')
    return store[String(foodId)] || store[String(foodName).toLowerCase().trim()] || null
  } catch { return null }
}

export default function CartPage({ user, toast, onOrderPlaced }) {
  const [cart,    setCart]    = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const res = await axios.get('/cart/view', { withCredentials: true })
      setCart(Array.isArray(res.data) ? res.data : [])
    } catch { setCart([]) }
    finally { setLoading(false) }
  }

  /* ── Price helpers ── */
  const getItemPrice = (item) => (item.foodItem?.price ?? item.food?.price ?? item.price ?? 0)
  const getItemQty   = (item) => (item.qty ?? item.quantity ?? 1)
  const getItemId    = (item) => item.id

  const subtotal   = cart.reduce((s, item) => s + getItemPrice(item) * getItemQty(item), 0)
  const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0
  const tax         = Math.round(subtotal * TAX_RATE)
  const grandTotal  = subtotal + deliveryFee + tax

  /* ── Update qty locally (optimistic) ── */
  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (getItemId(item) !== itemId) return item
      const currentQty = getItemQty(item)
      const newQty = currentQty + delta
      if (newQty <= 0) return null // will be filtered
      return { ...item, qty: newQty, quantity: newQty }
    }).filter(Boolean))
  }

  /* ── Remove item from cart ── */
  const removeItem = (itemId) => {
    setCart(prev => prev.filter(item => getItemId(item) !== itemId))
  }

  /* ── Place order — sends grandTotal (with tax + delivery) ── */
  const placeOrder = async () => {
    if (cart.length === 0) { toast('Your cart is empty!', 'error'); return }
    setPlacing(true)
    try {
      /*
        POST /order/place
        We pass the grandTotal in the request body so the backend stores
        the correct amount (food subtotal + delivery + tax).
        The backend's OrderServiceImpl recalculates from cart items —
        if it ignores the body total, we show the correct amount on the
        frontend Orders page via localStorage.
      */
      await axios.post('/order/place', { total: grandTotal }, { withCredentials: true })

      // Save the last order total + item snapshot locally so Orders page shows correct amount and items
      const history = JSON.parse(localStorage.getItem('nomzee_order_totals') || '[]')
      history.unshift({
        total: grandTotal,
        date: new Date().toISOString(),
        items: cart.length,
        items_snapshot: cart,  // ← full cart snapshot for order items display
      })
      localStorage.setItem('nomzee_order_totals', JSON.stringify(history.slice(0, 20)))

      toast(`Order placed! Total: ₹${grandTotal} 🎉`, 'success')
      setCart([])
      if (onOrderPlaced) onOrderPlaced()  // ← resets cart badge in navbar
      setTimeout(() => navigate('/orders'), 1200)
    } catch {
      toast('Failed to place order. Try again.', 'error')
    } finally { setPlacing(false) }
  }

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
            <h1 className="page-title">Your Cart</h1>
            <p className="page-subtitle">
              {cart.length > 0 ? `${cart.length} item${cart.length > 1 ? 's' : ''}` : 'Nothing here yet'}
            </p>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: '36px 24px 80px' }}>
        {cart.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h3>Your cart is empty</h3>
            <p>Add some delicious food from our menu</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

            {/* ── CART ITEMS ── */}
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                Order Items
              </h3>
              {cart.map((item, i) => (
                <CartRow
                  key={getItemId(item) ?? i}
                  item={item}
                  onIncrease={() => updateQty(getItemId(item), +1)}
                  onDecrease={() => updateQty(getItemId(item), -1)}
                  onRemove={()   => removeItem(getItemId(item))}
                />
              ))}
            </div>

            {/* ── ORDER SUMMARY ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px', position: 'sticky', top: 90 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                Order Summary
              </h3>

              {[
                ['Subtotal',             `₹${subtotal}`],
                ['Delivery Fee',         `₹${deliveryFee}`],
                ['Taxes & Charges (5%)', `₹${tax}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}

              {/* Grand total — this is what gets saved & shown everywhere */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 18, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>
                <span>Total Payable</span>
                <span style={{ color: 'var(--primary)' }}>₹{grandTotal}</span>
              </div>

              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                This amount (₹{grandTotal}) will be recorded in your order
              </div>

              <button
                onClick={placeOrder}
                disabled={placing}
                style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '15px', borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: placing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: placing ? 0.8 : 1, marginBottom: 12 }}
                onMouseEnter={e => { if (!placing) { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,77,0,0.4)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {placing
                  ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Placing Order...</>
                  : <>Place Order · ₹{grandTotal} →</>
                }
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Safe & Secure Checkout
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Cart Row — with +/- controls and delete button ── */
function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  const emojis = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤']
  const food   = item.foodItem ?? item.food ?? {}
  const qty    = item.qty ?? item.quantity ?? 1
  const price  = food.price ?? 0

  // Try to show uploaded image, then emoji fallback
  const uploadedImg = getFoodImage(food.id, food.name)
  const fallbackEmoji = food.imageUrl?.length <= 2 ? food.imageUrl : emojis[(food.id ?? 0) % emojis.length]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>

      {/* Food image — 1:1 square */}
      <div style={{ width: 64, height: 64, background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
        {uploadedImg
          ? <img src={uploadedImg} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : fallbackEmoji
        }
      </div>

      {/* Name & restaurant */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name ?? 'Item'}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{food.restaurant?.name ?? ''}</div>
        <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>₹{price} each</div>
      </div>

      {/* Qty controls — +1 / count / -1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
        <button
          onClick={onDecrease}
          title={qty === 1 ? 'Remove item' : 'Decrease'}
          style={{ width: 34, height: 36, background: 'none', border: 'none', color: qty === 1 ? '#EF4444' : 'var(--text2)', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = qty === 1 ? 'rgba(239,68,68,0.1)' : 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {qty === 1 ? '🗑' : '−'}
        </button>
        <span style={{ minWidth: 32, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{qty}</span>
        <button
          onClick={onIncrease}
          style={{ width: 34, height: 36, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >+</button>
      </div>

      {/* Line total */}
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, minWidth: 70, textAlign: 'right', flexShrink: 0 }}>
        ₹{price * qty}
      </div>

      {/* Delete button */}
      <button
        onClick={onRemove}
        title="Remove item"
        style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}
