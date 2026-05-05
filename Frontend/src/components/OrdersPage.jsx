import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const STEPS = ['Order Placed', 'Preparing', 'On the Way', 'Delivered']
const STEP_DELAY_MINS = [0, 0, 10, 20]

const getDeliveryTime = (createdAt, mins) => {
  const d = new Date(new Date(createdAt).getTime() + mins * 60 * 1000)
  return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
}

const getCurrentStep = (createdAt) => {
  if (!createdAt) return 1
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (elapsed >= 20) return 3
  if (elapsed >= 10) return 2
  return 1
}

const getFoodImage = (id, name) => {
  try {
    const store = JSON.parse(localStorage.getItem('nomzee_food_images') || '{}')
    return store[String(id)] || store[String(name).toLowerCase().trim()] || null
  } catch { return null }
}

export default function OrdersPage({ user }) {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchOrders()
  }, [user])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const fetchOrders = async () => {
    const localTotals = JSON.parse(localStorage.getItem('nomzee_order_totals') || '[]')
    try {
      const res = await axios.get('/order/my', { withCredentials: true })
      const backend = Array.isArray(res.data) ? res.data : []
      const merged  = backend.map((order, i) => ({
        ...order,
        total: localTotals[i]?.total ?? order.total ?? order.totalAmount,
        _items: localTotals[i]?.items_snapshot || [],
        _paymentId: localTotals[i]?.paymentId || null,
      }))
      setOrders(merged)
    } catch {
      if (localTotals.length > 0) {
        setOrders(localTotals.map((t, i) => ({
          id: `order-${i + 1}`,
          total: t.total,
          createdAt: t.date,
          _items: t.items_snapshot || [],
          _paymentId: t.paymentId || null,
        })))
      } else { setOrders([]) }
    } finally { setLoading(false) }
  }

  const fmt = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) +
      ' · ' + new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'120px 0' }}>
      <div className="loader"/>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-container page-header-inner">
          <div>
            <h1 className="page-title">Your Orders</h1>
            <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding:'36px 24px 80px', maxWidth:860 }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No orders yet</h3>
            <p>Your order history will appear here after you place an order.</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>Order Now</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {orders.map((order, i) => (
              <OrderCard key={order.id ?? i} order={order} fmt={fmt} navigate={navigate} tick={tick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, fmt, navigate, tick }) {
  const stepIndex   = getCurrentStep(order.createdAt)
  const isDelivered = stepIndex === 3
  const isOnWay     = stepIndex === 2

  const badgeStyle = isDelivered
    ? { background:'rgba(34,197,94,0.1)',  color:'var(--success)', border:'1px solid rgba(34,197,94,0.2)' }
    : isOnWay
    ? { background:'rgba(59,130,246,0.1)', color:'#60A5FA',        border:'1px solid rgba(59,130,246,0.2)' }
    : { background:'rgba(255,183,0,0.1)',  color:'var(--accent)',   border:'1px solid rgba(255,183,0,0.2)' }

  const statusIcon  = isDelivered ? '✓' : isOnWay ? '🛵' : '👨‍🍳'
  const statusLabel = STEPS[stepIndex]
  const items       = order._items || []

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', animation:'fadeUp 0.4s ease both', transition:'border-color 0.25s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,77,0,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
    >
      {/* Header */}
      <div style={{ padding:'20px 26px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text3)', marginBottom:3 }}>Order ID</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'var(--text)' }}>#{order.id}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:12, color:'var(--text2)' }}>{fmt(order.createdAt)}</div>
          <div style={{ padding:'6px 14px', borderRadius:999, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, ...badgeStyle }}>
            {statusIcon} {statusLabel}
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div style={{ padding:'24px 26px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          {STEPS.map((step, idx) => {
            const done    = idx <= stepIndex
            const current = idx === stepIndex && !isDelivered
            return (
              <div key={step} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                {idx < STEPS.length - 1 && (
                  <div style={{ position:'absolute', top:15, left:'50%', width:'100%', height:2, background: idx < stepIndex ? 'var(--success)' : 'var(--border)', zIndex:0, transition:'background 1s ease' }}/>
                )}
                <div style={{ width:32, height:32, borderRadius:'50%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background: done ? 'var(--success)' : 'var(--bg2)', border:`2px solid ${done ? 'var(--success)' : current ? 'var(--primary)' : 'var(--border)'}`, color: done ? 'white' : current ? 'var(--primary)' : 'var(--text3)', transition:'all 0.6s ease', animation: current ? 'pulse 2s ease-in-out infinite' : 'none', boxShadow: current ? '0 0 0 4px rgba(255,77,0,0.12)' : 'none' }}>
                  {done ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize:10, textAlign:'center', marginTop:8, color: done ? 'var(--text2)' : 'var(--text3)', fontWeight: current ? 700 : 500, whiteSpace:'nowrap' }}>
                  {step}
                </div>
                {order.createdAt && idx > 0 && (
                  <div style={{ fontSize:9, color: done ? 'var(--success)' : 'var(--text3)', marginTop:3, fontWeight:600 }}>
                    {done
                      ? (idx === 3 ? `✓ ${getDeliveryTime(order.createdAt, STEP_DELAY_MINS[idx])}` : '✓ Done')
                      : `~${getDeliveryTime(order.createdAt, STEP_DELAY_MINS[idx])}`
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ETA / Delivery notice */}
        {!isDelivered && order.createdAt && (
          <div style={{ marginTop:18, padding:'10px 16px', background:'rgba(255,183,0,0.06)', border:'1px solid rgba(255,183,0,0.15)', borderRadius:10, fontSize:13, color:'var(--accent)', display:'flex', alignItems:'center', gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {isOnWay
              ? `Your order is on the way! Expected delivery at ${getDeliveryTime(order.createdAt, 20)}`
              : `Estimated delivery by ${getDeliveryTime(order.createdAt, 20)}`
            }
          </div>
        )}
        {isDelivered && order.createdAt && (
          <div style={{ marginTop:18, padding:'10px 16px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:10, fontSize:13, color:'var(--success)', display:'flex', alignItems:'center', gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Delivered at {getDeliveryTime(order.createdAt, 20)} · Enjoy your meal! 🍽️
          </div>
        )}
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div style={{ padding:'20px 26px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Items Ordered</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map((item, i) => {
              const food  = item.foodItem ?? item.food ?? item
              const qty   = item.qty ?? item.quantity ?? 1
              const price = food.price ?? item.price ?? 0
              const img   = getFoodImage(food.id, food.name)
              const emoji = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤'][(food.id ?? i) % 10]
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {img ? <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : emoji}
                  </div>
                  <div style={{ flex:1, fontSize:14, fontWeight:500, color:'var(--text)' }}>{food.name ?? 'Item'}</div>
                  <div style={{ fontSize:13, color:'var(--text2)' }}>×{qty}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', minWidth:60, textAlign:'right' }}>₹{price * qty}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding:'18px 26px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
        <div>
          {order._paymentId && (
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>
              Payment ID: <span style={{ fontFamily:'monospace', color:'var(--text2)' }}>{order._paymentId}</span>
            </div>
          )}
          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Total Paid</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'var(--primary)' }}>
            ₹{order.total ?? order.totalAmount ?? '—'}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/menu')}
            style={{ background:'var(--primary)', color:'white', padding:'10px 22px', borderRadius:11, fontSize:14, fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--primary-dark)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.transform='translateY(0)' }}
          >🔁 Reorder</button>
          <button style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:11, padding:'10px 18px', fontSize:14, fontWeight:500, color:'var(--text2)', cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}
          >💬 Help</button>
        </div>
      </div>
    </div>
  )
}
