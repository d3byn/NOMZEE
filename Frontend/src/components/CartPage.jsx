import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const DELIVERY_FEE = 49
const TAX_RATE     = 0.05

const getFoodImage = (foodId, foodName) => {
  try {
    const store = JSON.parse(localStorage.getItem('nomzee_food_images') || '{}')
    return store[String(foodId)] || store[String(foodName).toLowerCase().trim()] || null
  } catch { return null }
}

// Load Razorpay script once
const loadRazorpayScript = () => new Promise(resolve => {
  if (window.Razorpay) { resolve(true); return }
  const s = document.createElement('script')
  s.src = 'https://checkout.razorpay.com/v1/checkout.js'
  s.onload  = () => resolve(true)
  s.onerror = () => resolve(false)
  document.body.appendChild(s)
})

export default function CartPage({ user, toast, onOrderPlaced }) {
  const [cart,           setCart]           = useState([])
  const [loading,        setLoading]        = useState(true)
  const [placing,        setPlacing]        = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
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

  const getItemPrice = (item) => (item.foodItem?.price ?? item.food?.price ?? item.price ?? 0)
  const getItemQty   = (item) => (item.qty ?? item.quantity ?? 1)
  const getItemId    = (item) => item.id

  const subtotal    = cart.reduce((s, i) => s + getItemPrice(i) * getItemQty(i), 0)
  const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0
  const tax         = Math.round(subtotal * TAX_RATE)
  const grandTotal  = subtotal + deliveryFee + tax

  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (getItemId(item) !== itemId) return item
      const newQty = getItemQty(item) + delta
      if (newQty <= 0) return null
      return { ...item, qty: newQty, quantity: newQty }
    }).filter(Boolean))
  }

  const removeItem = (itemId) => setCart(prev => prev.filter(i => getItemId(i) !== itemId))

  /* ── Place order in DB after payment success ─────────────────────────── */
  const placeOrderInDB = async (paymentId) => {
    setPlacing(true)
    try {
      await axios.post('/order/place', { total: grandTotal }, { withCredentials: true })

      const history = JSON.parse(localStorage.getItem('nomzee_order_totals') || '[]')
      history.unshift({
        total: grandTotal, date: new Date().toISOString(),
        items: cart.length, items_snapshot: cart, paymentId,
      })
      localStorage.setItem('nomzee_order_totals', JSON.stringify(history.slice(0, 20)))

      toast(`Payment successful! Order placed 🎉`, 'success')
      setCart([])
      if (onOrderPlaced) onOrderPlaced()
      setTimeout(() => navigate('/orders'), 1500)
    } catch {
      toast('Payment done but order save failed. Contact support.', 'error')
    } finally { setPlacing(false) }
  }

  /* ── Initiate Razorpay payment ───────────────────────────────────────── */
  const initiatePayment = async () => {
    if (cart.length === 0) { toast('Your cart is empty!', 'error'); return }
    setPaymentLoading(true)

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast('Payment gateway failed to load. Check internet connection.', 'error')
        setPaymentLoading(false)
        return
      }

      // 2. Create Razorpay order on backend
      let orderData
      try {
        const res = await axios.post(
          '/payment/create-order',
          { amount: grandTotal },
          { withCredentials: true }
        )
        orderData = res.data
      } catch (err) {
        const msg = err.response?.data
        const text = typeof msg === 'string' ? msg : (msg?.message || 'Failed to create payment order. Check backend logs.')
        toast(text, 'error')
        setPaymentLoading(false)
        return
      }

      const { orderId, keyId } = orderData

      // 3. Open Razorpay checkout
      const options = {
        key:         keyId,
        amount:      grandTotal * 100,   // paise
        currency:    'INR',
        name:        'NOMZEE',
        description: `${cart.length} item${cart.length > 1 ? 's' : ''}`,
        image:       '/logo_nomzee.png',
        order_id:    orderId,
        handler: async (response) => {
          // 4. Verify signature on backend
          try {
            const vRes = await axios.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }, { withCredentials: true })

            if (vRes.data?.success) {
              await placeOrderInDB(response.razorpay_payment_id)
            } else {
              toast('Payment verification failed. Contact support.', 'error')
            }
          } catch {
            toast('Verification error. Contact support.', 'error')
          }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme:   { color: '#FF4D00' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', 'info')
            setPaymentLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        toast(`Payment failed: ${resp.error?.description || 'Unknown error'}`, 'error')
        setPaymentLoading(false)
      })
      rzp.open()

    } catch (err) {
      toast('Unexpected error. Try again.', 'error')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'120px 0' }}>
      <div className="loader"/>
    </div>
  )

  const isProcessing = placing || paymentLoading

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

      <div className="page-container" style={{ padding:'36px 24px 80px' }}>
        {cart.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h3>Your cart is empty</h3>
            <p>Add some delicious food from our menu</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:28, alignItems:'start' }}>

            {/* ── ITEMS ── */}
            <div>
              <h3 style={{ fontSize:17, fontWeight:700, marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
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

            {/* ── SUMMARY ── */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'26px', position:'sticky', top:90 }}>
              <h3 style={{ fontSize:17, fontWeight:700, marginBottom:22, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
                Order Summary
              </h3>

              {[
                ['Subtotal',               `₹${subtotal}`],
                ['Delivery Fee',           `₹${deliveryFee}`],
                ['Taxes & Charges (5%)',   `₹${tax}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'var(--text2)', marginBottom:12 }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}

              <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:18, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:'var(--text)' }}>
                <span>Total Payable</span>
                <span style={{ color:'var(--primary)' }}>₹{grandTotal}</span>
              </div>

              {/* Info box */}
              <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, color:'var(--success)', display:'flex', alignItems:'center', gap:8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ₹{grandTotal} will be charged including all fees
              </div>

              {/* Pay button */}
              <button
                onClick={initiatePayment}
                disabled={isProcessing}
                style={{ width:'100%', background:'var(--primary)', color:'white', padding:'15px', borderRadius:12, fontSize:16, fontWeight:700, fontFamily:"'Syne',sans-serif", border:'none', cursor:isProcessing?'not-allowed':'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10, opacity:isProcessing?0.8:1, marginBottom:8 }}
                onMouseEnter={e => { if(!isProcessing){ e.currentTarget.style.background='var(--primary-dark)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(255,77,0,0.4)' }}}
                onMouseLeave={e => { e.currentTarget.style.background='var(--primary)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
              >
                {isProcessing
                  ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>{placing ? ' Saving Order...' : ' Opening Payment...'}</>
                  : <>💳 Pay ₹{grandTotal} &amp; Place Order</>
                }
              </button>

              <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginBottom:14 }}>
                🔒 Secured by Razorpay · Test Mode
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, color:'var(--text3)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Safe &amp; Secure Checkout
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  const emojis = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤']
  const food   = item.foodItem ?? item.food ?? {}
  const qty    = item.qty ?? item.quantity ?? 1
  const price  = food.price ?? 0
  const uploadedImg = getFoodImage(food.id, food.name)
  const fallback    = food.imageUrl?.length <= 2 ? food.imageUrl : emojis[(food.id ?? 0) % emojis.length]

  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ width:64, height:64, background:'var(--surface2)', borderRadius:12, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
        {uploadedImg
          ? <img src={uploadedImg} alt={food.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : fallback
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:15, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{food.name ?? 'Item'}</div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>{food.restaurant?.name ?? ''}</div>
        <div style={{ fontSize:13, color:'var(--primary)', fontWeight:700, marginTop:4 }}>₹{price} each</div>
      </div>

      {/* Qty controls */}
      <div style={{ display:'flex', alignItems:'center', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', flexShrink:0 }}>
        <button onClick={onDecrease} title={qty===1?'Remove':'Decrease'}
          style={{ width:34, height:36, background:'none', border:'none', color:qty===1?'#EF4444':'var(--text2)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseEnter={e => e.currentTarget.style.background=qty===1?'rgba(239,68,68,0.1)':'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          {qty===1?'🗑':'−'}
        </button>
        <span style={{ minWidth:32, textAlign:'center', fontSize:14, fontWeight:700, color:'var(--text)' }}>{qty}</span>
        <button onClick={onIncrease}
          style={{ width:34, height:36, background:'none', border:'none', color:'var(--text2)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >+</button>
      </div>

      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, minWidth:70, textAlign:'right', color:'var(--text)', flexShrink:0 }}>
        ₹{price * qty}
      </div>

      <button onClick={onRemove} title="Remove"
        style={{ width:32, height:32, borderRadius:8, background:'none', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='#EF4444'; e.currentTarget.style.color='#EF4444' }}
        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}
