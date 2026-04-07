import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

/* ── Image store ──────────────────────────────────────────────────────────── */
const IMG_KEY = 'nomzee_food_images'

export const getFoodImage = (foodId, foodName) => {
  try {
    const store = JSON.parse(localStorage.getItem(IMG_KEY) || '{}')
    return store[String(foodId)] || store[String(foodName).toLowerCase().trim()] || null
  } catch { return null }
}

const saveImage = (foodId, foodName, dataUrl) => {
  try {
    const store = JSON.parse(localStorage.getItem(IMG_KEY) || '{}')
    if (foodId)   store[String(foodId)]                         = dataUrl
    if (foodName) store[String(foodName).toLowerCase().trim()]  = dataUrl
    localStorage.setItem(IMG_KEY, JSON.stringify(store))
  } catch {}
}

/* ── Canvas crop → 1:1 square ─────────────────────────────────────────────── */
const cropToSquare = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const side = Math.min(img.width, img.height)
      const sx   = (img.width  - side) / 2
      const sy   = (img.height - side) / 2
      const OUT  = 400
      const c    = document.createElement('canvas')
      c.width = c.height = OUT
      c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, OUT, OUT)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })

/* ── Drag & Drop Image Uploader ───────────────────────────────────────────── */
function ImageUploader({ onChange }) {
  const [dragOver,    setDragOver]    = useState(false)
  const [preview,     setPreview]     = useState(null)
  const [processing,  setProcessing]  = useState(false)
  const fileRef = useRef()

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setProcessing(true)
    try {
      const cropped = await cropToSquare(file)
      setPreview(cropped)
      onChange(cropped)
    } catch { } finally { setProcessing(false) }
  }, [onChange])

  const clearImage = () => { setPreview(null); onChange(''); if (fileRef.current) fileRef.current.value = '' }

  return (
    <div>
      <div
        onClick={() => !preview && fileRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary)' : preview ? 'var(--success)' : 'var(--border)'}`,
          borderRadius: 14, background: dragOver ? 'rgba(255,77,0,0.06)' : 'transparent',
          cursor: preview ? 'default' : 'pointer', transition: 'all 0.25s',
          overflow: 'hidden', position: 'relative',
          width: '100%', aspectRatio: '1/1', maxWidth: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {processing ? (
          <div style={{ textAlign: 'center' }}>
            <div className="loader" style={{ margin: '0 auto 10px' }}/>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Cropping...</div>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); clearImage() }}
              style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.85)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
            >✕</button>
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>1:1</div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 5 }}>{dragOver ? 'Drop here' : 'Drag & drop image'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>PNG · JPG · WEBP · auto 1:1</div>
            <div style={{ display: 'inline-block', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Browse</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => processFile(e.target.files?.[0])} />
      {preview && !processing && <div style={{ marginTop: 7, fontSize: 12, color: 'var(--success)' }}>✓ Cropped to 1:1 — will show in menu</div>}
    </div>
  )
}


/* ── Dashboard Page ───────────────────────────────────────────────────────── */
export default function DashboardPage({ user, onFoodsUpdated, toast }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('restaurant')

  /* Restaurant */
  const [rForm,    setRForm]    = useState({ name: '', address: '' })
  const [rLoading, setRLoading] = useState(false)

  /* MY restaurants only (owner = logged-in user) */
  const [myRestaurants,  setMyRestaurants]  = useState([])
  const [restsLoading,   setRestsLoading]   = useState(false)
  const [selectedRestId, setSelectedRestId] = useState('')

  /* Food add form */
  const [fForm,      setFForm]      = useState({ name: '', description: '', price: '' })
  const [imgDataUrl, setImgDataUrl] = useState('')
  const [fLoading,   setFLoading]   = useState(false)

  /* All foods from DB that belong to MY restaurants */
  const [myFoods,         setMyFoods]         = useState([])
  const [foodsLoading,    setFoodsLoading]     = useState(false)

  if (!user || user.role !== 'BUSINESS') { navigate('/'); return null }

  /* ── Fetch ONLY MY restaurants via GET /restaurant/my ─────────────────── */
  const fetchMyRestaurants = async () => {
    setRestsLoading(true)
    try {
      /* Primary: session-aware endpoint that returns only the logged-in user's restaurants */
      const res  = await axios.get('/restaurant/my', { withCredentials: true })
      const list = Array.isArray(res.data) ? res.data : []
      setMyRestaurants(list)
      if (list.length > 0) {
        const firstId = String(list[0].id)
        setSelectedRestId(prev => prev || firstId)
      }
      return list
    } catch {
      /* Fallback: GET /restaurant/all then filter client-side by owner email.
         This is a best-effort approach when /restaurant/my doesn't exist yet. */
      try {
        const res2  = await axios.get('/restaurant/all', { withCredentials: true })
        const all   = Array.isArray(res2.data) ? res2.data : []
        // Filter by owner email stored in the restaurant owner object
        const mine  = all.filter(r => {
          const ownerEmail = r.owner?.email ?? r.ownerEmail ?? ''
          return ownerEmail === user.email
        })
        setMyRestaurants(mine)
        if (mine.length > 0) setSelectedRestId(prev => prev || String(mine[0].id))
        return mine
      } catch {
        setMyRestaurants([])
        return []
      }
    } finally { setRestsLoading(false) }
  }

  /* ── Fetch foods — STRICT filter to MY restaurant IDs only ────────────── */
  const fetchMyFoods = async (myRests) => {
    const rests = myRests ?? myRestaurants
    if (rests.length === 0) { setMyFoods([]); return }

    setFoodsLoading(true)
    const myIds = new Set(rests.map(r => String(r.id)))
    try {
      const res = await axios.get('/food/all')
      const all = Array.isArray(res.data) ? res.data : []
      /* Only include foods whose restaurant.id is in MY restaurants */
      const mine = all.filter(f => myIds.has(String(f.restaurant?.id ?? f.restaurantId ?? '')))
      setMyFoods(mine)
    } catch { setMyFoods([]) }
    finally { setFoodsLoading(false) }
  }

  useEffect(() => {
    fetchMyRestaurants().then(list => fetchMyFoods(list))
  }, [])

  /* ── Add Restaurant ─────────────────────────────────────────────────────── */
  const addRestaurant = async (e) => {
    e.preventDefault()
    setRLoading(true)
    try {
      const res  = await axios.post('/restaurant/add', rForm, { withCredentials: true })
      const saved = res.data
      toast(`Restaurant "${saved.name}" added! ID: ${saved.id} 🏪`, 'success')
      setRForm({ name: '', address: '' })
      const updatedList = await fetchMyRestaurants()
      setSelectedRestId(String(saved.id))
      await fetchMyFoods(updatedList)
      setTab('food')
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to add restaurant', 'error')
    } finally { setRLoading(false) }
  }

  /* ── Add Food ────────────────────────────────────────────────────────────── */
  const addFood = async (e) => {
    e.preventDefault()
    const rid = parseInt(selectedRestId)
    if (!rid || isNaN(rid)) { toast('Please select a restaurant first', 'error'); return }
    setFLoading(true)
    try {
      const nameKey  = fForm.name.trim().toLowerCase().replace(/\s+/g, '_')
      const imageUrl = imgDataUrl ? `local:${nameKey}` : 'img'
      const payload  = {
        name:        fForm.name.trim(),
        description: fForm.description.trim(),
        price:       parseFloat(fForm.price),
        imageUrl,
        restaurant:  { id: rid },
      }
      const res  = await axios.post('/food/add', payload, { withCredentials: true })
      const saved = res.data
      if (imgDataUrl) saveImage(saved.id, fForm.name.trim(), imgDataUrl)
      setFForm({ name: '', description: '', price: '' })
      setImgDataUrl('')
      toast(`"${saved.name}" added to menu! 🍽️`, 'success')
      await fetchMyFoods()
      if (onFoodsUpdated) onFoodsUpdated()
    } catch (err) {
      const msg  = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to add food item', 'error')
    } finally { setFLoading(false) }
  }

  /* ── Style helpers ────────────────────────────────────────────────────────── */
  const inp = { background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 11, padding: '12px 14px', color: 'var(--text)', fontSize: 15, width: '100%', transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif" }
  const lbl = { fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }
  const fo  = (e) => e.target.style.borderColor = 'var(--primary)'
  const bl  = (e) => e.target.style.borderColor = 'var(--border)'

  const TABS = [
    { key: 'restaurant', label: '🏪 Add Restaurant' },
    { key: 'food',       label: '🍽️ Add Food Item'  },
    { key: 'list',       label: `📋 Manage Menu (${myFoods.length})` },
  ]

  const selectedRest = myRestaurants.find(r => String(r.id) === selectedRestId)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-container page-header-inner">
          <div>
            <h1 className="page-title">Business Dashboard</h1>
            <p className="page-subtitle">Manage your restaurant and menu items</p>
          </div>
          {selectedRest && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '10px 18px', fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
              🏪 {selectedRest.name} · ID: {selectedRest.id}
            </div>
          )}
        </div>
      </div>

      <div className="page-container" style={{ padding: '32px 24px 80px', maxWidth: 860 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 5, width: 'fit-content', marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s', background: tab === t.key ? 'var(--primary)' : 'transparent', color: tab === t.key ? 'white' : 'var(--text2)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ADD RESTAURANT ── */}
        {tab === 'restaurant' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, animation: 'fadeUp 0.3s ease' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Register Your Restaurant</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Add your restaurant first, then list food items from the "Add Food Item" tab.</p>

            {myRestaurants.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your Restaurants</div>
                {myRestaurants.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>· {r.address}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>ID: {r.id}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div><label style={lbl}>Restaurant Name</label><input style={inp} placeholder="e.g. Food Paradise" value={rForm.name} onChange={e => setRForm(p => ({ ...p, name: e.target.value }))} onFocus={fo} onBlur={bl} required /></div>
              <div><label style={lbl}>Address</label><input style={inp} placeholder="e.g. Kolkata" value={rForm.address} onChange={e => setRForm(p => ({ ...p, address: e.target.value }))} onFocus={fo} onBlur={bl} required /></div>
              <button type="submit" disabled={rLoading} style={{ alignSelf: 'flex-start', background: 'var(--primary)', color: 'white', padding: '13px 30px', borderRadius: 11, fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: rLoading ? 'not-allowed' : 'pointer', opacity: rLoading ? 0.7 : 1 }}>
                {rLoading ? 'Adding...' : '+ Add Restaurant'}
              </button>
            </form>
          </div>
        )}

        {/* ── ADD FOOD ── */}
        {tab === 'food' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, animation: 'fadeUp 0.3s ease' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Add Food Item</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Fill in details and upload a photo. It will appear in the menu for customers.</p>
            <form onSubmit={addFood} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Restaurant selector */}
              <div>
                <label style={lbl}>Select Your Restaurant</label>
                {restsLoading ? (
                  <div style={{ color: 'var(--text2)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Loading...
                  </div>
                ) : myRestaurants.length > 0 ? (
                  <>
                    <select style={{ ...inp, cursor: 'pointer' }} value={selectedRestId} onChange={e => setSelectedRestId(e.target.value)} onFocus={fo} onBlur={bl} required>
                      <option value="">— Select your restaurant —</option>
                      {myRestaurants.map(r => <option key={r.id} value={String(r.id)}>{r.name} · {r.address} (ID: {r.id})</option>)}
                    </select>
                    <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>✓ Showing only your restaurants</div>
                  </>
                ) : (
                  <div style={{ background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.25)', borderRadius: 11, padding: '14px 18px' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>⚠️ No restaurants found</div>
                    <button type="button" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }} onClick={() => setTab('restaurant')}>→ Add Your Restaurant First</button>
                  </div>
                )}
              </div>

              {myRestaurants.length > 0 && selectedRestId && (<>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div><label style={lbl}>Food Name</label><input style={inp} placeholder="e.g. Pizza" value={fForm.name} onChange={e => setFForm(p => ({ ...p, name: e.target.value }))} onFocus={fo} onBlur={bl} required /></div>
                  <div><label style={lbl}>Price (₹)</label><input style={inp} type="number" placeholder="e.g. 250" value={fForm.price} onChange={e => setFForm(p => ({ ...p, price: e.target.value }))} onFocus={fo} onBlur={bl} required min="1" /></div>
                </div>
                <div><label style={lbl}>Description</label><input style={inp} placeholder="e.g. Cheesy pizza" value={fForm.description} onChange={e => setFForm(p => ({ ...p, description: e.target.value }))} onFocus={fo} onBlur={bl} /></div>
                <div><label style={lbl}>Food Image (auto-cropped to 1:1)</label><ImageUploader onChange={setImgDataUrl} /></div>
                <button type="submit" disabled={fLoading} style={{ alignSelf: 'flex-start', background: 'var(--primary)', color: 'white', padding: '13px 32px', borderRadius: 11, fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: fLoading ? 'not-allowed' : 'pointer', opacity: fLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {fLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Adding...</> : '+ Add to Menu'}
                </button>
              </>)}
            </form>
          </div>
        )}

        {/* ── MANAGE MENU ── */}
        {tab === 'list' && (
          <ManageMenuTab
            foods={myFoods}
            loading={foodsLoading}
            myRestaurantIds={new Set(myRestaurants.map(r => String(r.id)))}
            setTab={setTab}
            onRefresh={() => fetchMyRestaurants().then(list => fetchMyFoods(list))}
            onFoodUpdated={() => { fetchMyFoods(); if (onFoodsUpdated) onFoodsUpdated() }}
            toast={toast}
          />
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MANAGE MENU TAB — shows ONLY this owner's foods, with edit + delete + toggle
══════════════════════════════════════════════════════════════════════════════ */
const UNAVAIL_KEY = 'nomzee_unavailable_foods'

function ManageMenuTab({ foods, loading, myRestaurantIds, setTab, onRefresh, onFoodUpdated, toast }) {
  const [unavailable, setUnavailable] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(UNAVAIL_KEY) || '[]')) }
    catch { return new Set() }
  })
  const [search,     setSearch]     = useState('')
  const [editingId,  setEditingId]  = useState(null)   // food ID being edited
  const [editForm,   setEditForm]   = useState({})
  const [editImg,    setEditImg]    = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // food ID pending delete
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Safety: extra filter — only show foods from MY restaurants
  const myFoods = foods.filter(f => myRestaurantIds.has(String(f.restaurant?.id ?? f.restaurantId ?? '')))
  const filtered = myFoods.filter(f =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAvailability = (foodId) => {
    const id   = String(foodId)
    const next = new Set(unavailable)
    if (next.has(id)) next.delete(id); else next.add(id)
    setUnavailable(next)
    localStorage.setItem(UNAVAIL_KEY, JSON.stringify([...next]))
  }

  /* ── Start editing a food item ── */
  const startEdit = (f) => {
    setEditingId(f.id)
    setEditForm({ name: f.name, description: f.description || '', price: String(f.price), imageUrl: f.imageUrl || '' })
    setEditImg('')
  }

  /* ── Save edited food to backend ── */
  const saveEdit = async (foodId) => {
    setEditLoading(true)
    try {
      const nameKey  = editForm.name.trim().toLowerCase().replace(/\s+/g, '_')
      const imageUrl = editImg ? `local:${nameKey}` : editForm.imageUrl

      // PUT /food/update/{id}
      const payload = {
        name:        editForm.name.trim(),
        description: editForm.description.trim(),
        price:       parseFloat(editForm.price),
        imageUrl,
      }
      await axios.put(`/food/update/${foodId}`, payload, { withCredentials: true })

      // Save new image if changed
      if (editImg) saveImage(foodId, editForm.name.trim(), editImg)

      toast('Food item updated! ✓', 'success')
      setEditingId(null)
      setEditImg('')
      if (onFoodUpdated) onFoodUpdated()
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to update. Check backend.', 'error')
    } finally { setEditLoading(false) }
  }

  /* ── Delete food from backend ── */
  const confirmDelete = async (foodId) => {
    setDeleteLoading(true)
    try {
      // DELETE /food/delete/{id}
      await axios.delete(`/food/delete/${foodId}`, { withCredentials: true })
      toast('Food item removed from menu', 'success')
      setDeleteConfirm(null)
      if (onFoodUpdated) onFoodUpdated()
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to delete. Check backend.', 'error')
      setDeleteConfirm(null)
    } finally { setDeleteLoading(false) }
  }

  const inp  = { background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 14, width: '100%', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s' }

  if (loading) return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 40, display: 'flex', justifyContent: 'center' }}>
      <div className="loader"/>
    </div>
  )

  if (myFoods.length === 0) return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Manage Menu</h3>
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <span className="empty-icon" style={{ fontSize: 40 }}>🍽️</span>
        <p>No food items from your restaurants yet.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setTab('food')}>+ Add Food Item</button>
          <button className="btn-ghost" onClick={onRefresh} style={{ padding: '12px 20px' }}>↻ Refresh</button>
        </div>
      </div>
    </div>
  )

  const availCount   = myFoods.filter(f => !unavailable.has(String(f.id))).length
  const unavailCount = myFoods.filter(f =>  unavailable.has(String(f.id))).length

  return (
    <>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, animation: 'fadeUp 0.3s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Manage Menu
              <span style={{ marginLeft: 10, background: 'var(--primary)', color: 'white', fontSize: 13, padding: '2px 10px', borderRadius: 999, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{myFoods.length}</span>
            </h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {availCount} available</span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>✕ {unavailCount} unavailable</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRefresh} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 16px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
            >↻ Refresh</button>
            <button onClick={() => setTab('food')} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>+ Add Item</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 11, padding: '10px 14px', gap: 10, marginBottom: 20 }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, color: 'var(--text)' }} placeholder="Search your menu..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>}
        </div>

        {/* Food rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((f) => {
            const id       = String(f.id)
            const isOff    = unavailable.has(id)
            const isEditing = editingId === f.id
            const imgStore = (() => { try { return JSON.parse(localStorage.getItem(IMG_KEY) || '{}') } catch { return {} } })()
            const img      = imgStore[id] || imgStore[String(f.name).toLowerCase().trim()] || null
            const emojis   = ['🍔','🍕','🍜','🌮','🍣','🍗','🥗','🍫','🍟','🥤']
            const fallback = emojis[(f.id ?? 0) % emojis.length]

            return (
              <div key={id} style={{ border: `1px solid ${isOff ? 'rgba(239,68,68,0.25)' : isEditing ? 'rgba(255,77,0,0.35)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.25s', background: isEditing ? 'rgba(255,77,0,0.03)' : isOff ? 'rgba(239,68,68,0.03)' : 'var(--bg2)' }}>

                {/* ── Normal view row ── */}
                {!isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', opacity: isOff ? 0.7 : 1 }}>
                    {/* Image */}
                    <div style={{ width: 58, height: 58, borderRadius: 12, overflow: 'hidden', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                      {img ? <img src={img} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isOff ? 'grayscale(60%)' : 'none' }} /> : fallback}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {f.name}
                        {isOff && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 7px', borderRadius: 4 }}>Unavailable</span>}
                      </div>
                      {f.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.description}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>₹{f.price}</span>
                        {f.restaurant?.name && <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 6 }}>{f.restaurant.name}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* Edit */}
                      <button onClick={() => startEdit(f)} title="Edit" style={{ width: 34, height: 34, borderRadius: 9, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'rgba(255,77,0,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'none' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>

                      {/* Delete */}
                      <button onClick={() => setDeleteConfirm(f.id)} title="Delete" style={{ width: 34, height: 34, borderRadius: 9, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'none' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>

                      {/* Availability toggle */}
                      <div title={isOff ? 'Click: mark Available' : 'Click: mark Unavailable'} onClick={() => toggleAvailability(f.id)}
                        style={{ width: 52, height: 28, borderRadius: 14, background: isOff ? '#EF4444' : 'var(--success)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.3s', boxShadow: `0 2px 8px ${isOff ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}
                      >
                        <div style={{ position: 'absolute', top: 4, left: isOff ? 4 : 24, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.25s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}/>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Edit form (inline expanded) ── */}
                {isEditing && (
                  <div style={{ padding: '20px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Editing: {f.name}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Food Name</label>
                        <input style={inp} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Price (₹)</label>
                        <input style={inp} type="number" min="1" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
                      <input style={inp} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                        Update Image (optional — leave empty to keep current)
                      </label>
                      <ImageUploader onChange={setEditImg} />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => saveEdit(f.id)} disabled={editLoading} style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", border: 'none', cursor: editLoading ? 'not-allowed' : 'pointer', opacity: editLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {editLoading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Saving...</> : '✓ Save Changes'}
                      </button>
                      <button onClick={() => { setEditingId(null); setEditImg('') }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontSize: 14, color: 'var(--text2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,183,0,0.05)', border: '1px solid rgba(255,183,0,0.12)', borderRadius: 10, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Only your restaurant's items are shown. Unavailable items appear greyed out in the menu.
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => !deleteLoading && setDeleteConfirm(null)}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, maxWidth: 400, width: '100%', animation: 'fadeUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Delete Item?</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              This will permanently remove <strong>{foods.find(f => f.id === deleteConfirm)?.name}</strong> from the menu and database. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => !deleteLoading && setDeleteConfirm(null)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px', fontSize: 15, color: 'var(--text2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button onClick={() => confirmDelete(deleteConfirm)} disabled={deleteLoading} style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: deleteLoading ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: deleteLoading ? 0.7 : 1 }}>
                {deleteLoading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Deleting...</> : '🗑 Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
