import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const statusStyle = (status) => {
  const map = {
    PENDING:  { bg:'rgba(255,183,0,0.12)',  border:'rgba(255,183,0,0.3)',  text:'#FFB700' },
    APPROVED: { bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)', text:'#16A34A' },
    REJECTED: { bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)', text:'#EF4444' },
    BLOCKED:  { bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)', text:'#EF4444' },
    ACTIVE:   { bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.2)',  text:'#16A34A' },
    CUSTOMER: { bg:'rgba(255,77,0,0.08)',   border:'rgba(255,77,0,0.2)',   text:'var(--primary)' },
    BUSINESS: { bg:'rgba(255,183,0,0.08)',  border:'rgba(255,183,0,0.2)', text:'#E08000' },
  }
  const c = map[status] || map.PENDING
  return {
    display:'inline-block', padding:'3px 10px', borderRadius:7,
    fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
    background:c.bg, border:`1px solid ${c.border}`, color:c.text,
  }
}

export default function AdminPage({ user, toast }) {
  const navigate = useNavigate()

  const [tab,           setTab]          = useState('approvals')
  const [approvals,     setApprovals]    = useState([])
  const [users,         setUsers]        = useState([])
  const [restaurants,   setRestaurants]  = useState([])
  const [loading,       setLoading]      = useState(true)
  const [error,         setError]        = useState(null)
  const [actionLoading, setActionLoading]= useState(null)
  const [rejectModal,   setRejectModal]  = useState(null)
  const [rejectReason,  setRejectReason] = useState('')
  const [searchUsers,   setSearchUsers]  = useState('')
  const [searchRests,   setSearchRests]  = useState('')

  // ── Guard: must be ADMIN ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'ADMIN') { navigate('/'); return }
    fetchAll()
  }, [user])

  // ── Fetch everything ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [aRes, uRes, rRes] = await Promise.allSettled([
        axios.get('/admin/all-approvals',   { withCredentials: true }),
        axios.get('/admin/all-users',        { withCredentials: true }),
        axios.get('/admin/all-restaurants',  { withCredentials: true }),
      ])

      // Handle each independently so one failure doesn't break the others
      if (aRes.status === 'fulfilled') {
        setApprovals(Array.isArray(aRes.value.data) ? aRes.value.data : [])
      } else {
        console.error('Approvals fetch failed:', aRes.reason?.response?.status, aRes.reason?.response?.data)
        setApprovals([])
      }

      if (uRes.status === 'fulfilled') {
        setUsers(Array.isArray(uRes.value.data) ? uRes.value.data : [])
      } else {
        console.error('Users fetch failed:', uRes.reason?.response?.status, uRes.reason?.response?.data)
        setUsers([])
      }

      if (rRes.status === 'fulfilled') {
        setRestaurants(Array.isArray(rRes.value.data) ? rRes.value.data : [])
      } else {
        console.error('Restaurants fetch failed:', rRes.reason?.response?.status, rRes.reason?.response?.data)
        setRestaurants([])
      }

      // If ALL three failed with 403, it's a session/auth issue
      const allFailed = [aRes, uRes, rRes].every(r => r.status === 'rejected')
      if (allFailed) {
        const status = aRes.reason?.response?.status
        if (status === 403) {
          setError('Session expired or role not recognized. Please log out and log back in as Admin.')
        } else {
          setError(`Backend error (${status || 'network'}). Make sure the Spring Boot server is running.`)
        }
      }
    } catch (e) {
      setError('Unexpected error loading admin data. Check backend is running.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  const approve = async (restaurantId, name) => {
    setActionLoading(`approve-${restaurantId}`)
    try {
      await axios.post(`/admin/approve-restaurant/${restaurantId}`, {}, { withCredentials: true })
      toast(`✓ "${name}" approved! Owner can now add food items.`, 'success')
      setTimeout(fetchAll, 300)
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to approve — check backend logs', 'error')
    } finally { setActionLoading(null) }
  }

  const rejectConfirm = async () => {
    if (!rejectModal) return
    setActionLoading(`reject-${rejectModal.restaurantId}`)
    try {
      await axios.post(
        `/admin/reject-restaurant/${rejectModal.restaurantId}`,
        { reason: rejectReason },
        { withCredentials: true }
      )
      toast(`"${rejectModal.name}" rejected.`, 'info')
      setRejectModal(null)
      setRejectReason('')
      setTimeout(fetchAll, 300)
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Failed to reject', 'error')
    } finally { setActionLoading(null) }
  }

  const toggleRestaurant = async (r) => {
    const isBlocked = r.status === 'BLOCKED'
    const endpoint  = isBlocked ? 'unblock-restaurant' : 'block-restaurant'
    setActionLoading(`rest-${r.id}`)
    try {
      await axios.post(`/admin/${endpoint}/${r.id}`, {}, { withCredentials: true })
      toast(`"${r.name}" ${isBlocked ? 'unblocked ✓' : 'blocked'}.`, isBlocked ? 'success' : 'info')
      setTimeout(fetchAll, 300)
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Action failed', 'error')
    } finally { setActionLoading(null) }
  }

  const toggleUser = async (u) => {
    const isBlocked = u.blocked === true || u.isBlocked === true
    const endpoint  = isBlocked ? 'unblock-user' : 'block-user'
    setActionLoading(`user-${u.id}`)
    try {
      await axios.post(`/admin/${endpoint}/${u.id}`, {}, { withCredentials: true })
      toast(`User "${u.name}" ${isBlocked ? 'unblocked ✓' : 'blocked'}.`, isBlocked ? 'success' : 'info')
      setTimeout(fetchAll, 300)
    } catch (err) {
      const msg = err.response?.data
      toast(typeof msg === 'string' ? msg : 'Action failed', 'error')
    } finally { setActionLoading(null) }
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const pendingCount  = approvals.filter(a => a.status === 'PENDING').length
  const nonAdminUsers = users.filter(u => u.role !== 'ADMIN')
  const blockedUsers  = nonAdminUsers.filter(u => u.blocked === true || u.isBlocked === true).length

  const filteredUsers = nonAdminUsers.filter(u =>
    !searchUsers ||
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredRests = restaurants.filter(r =>
    !searchRests || r.name?.toLowerCase().includes(searchRests.toLowerCase())
  )

  // ── Reusable action button ────────────────────────────────────────────────
  const ActionBtn = ({ label, onClick, color, id, disabled }) => {
    const busy = actionLoading === id
    return (
      <button
        onClick={onClick}
        disabled={busy || disabled}
        style={{
          background: color || 'var(--primary)', color: 'white', border: 'none',
          borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 600,
          cursor: (busy || disabled) ? 'not-allowed' : 'pointer',
          opacity: (busy || disabled) ? 0.6 : 1,
          fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
          display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!busy && !disabled) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = (busy || disabled) ? '0.6' : '1' }}
      >
        {busy && (
          <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
        )}
        {label}
      </button>
    )
  }

  const TABS = [
    { key: 'approvals',   label: `🏪 Approvals${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` },
    { key: 'users',       label: `👤 Users (${nonAdminUsers.length})` },
    { key: 'restaurants', label: `🍽️ Restaurants (${restaurants.length})` },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-container page-header-inner">
          <div>
            <h1 className="page-title">⚙ Admin Panel</h1>
            <p className="page-subtitle">Platform-wide control — users, restaurants & approvals</p>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Pending',        value: pendingCount,         color: '#FFB700' },
              { label: 'Blocked Users',  value: blockedUsers,          color: '#EF4444' },
              { label: 'Restaurants',    value: restaurants.length,   color: 'var(--success)' },
              { label: 'Users',          value: nonAdminUsers.length, color: 'var(--primary)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', minWidth: 64 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: '24px 24px 80px' }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Failed to load admin data</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{error}</div>
              <button onClick={fetchAll} style={{ marginTop: 10, background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Tabs + Refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 5 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '9px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: tab === t.key
                  ? (t.key === 'approvals' && pendingCount > 0 ? '#FFB700' : 'var(--primary)')
                  : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text2)',
              }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={fetchAll} disabled={loading} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 18px', fontSize: 13, color: 'var(--text2)', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
          >
            {loading
              ? <><div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Loading...</>
              : '↻ Refresh'
            }
          </button>
        </div>

        {/* ── APPROVALS TAB ── */}
        {tab === 'approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? (
              <LoadingSkeleton count={3}/>
            ) : approvals.length === 0 ? (
              <EmptyState icon="📋" title="No approval requests yet" desc="When business owners register restaurants, they'll appear here for you to approve or reject." />
            ) : (
              approvals.map(a => {
                const r     = a.restaurant || {}
                const owner = a.requestedBy || {}
                const isPending = a.status === 'PENDING'
                return (
                  <div key={a.id} style={{ background: 'var(--surface)', border: `1.5px solid ${isPending ? 'rgba(255,183,0,0.35)' : 'var(--border)'}`, borderRadius: 16, padding: '20px 24px', animation: 'fadeUp 0.3s ease', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{r.name || 'Unnamed Restaurant'}</span>
                          <span style={statusStyle(a.status)}>{a.status}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 3 }}>📍 {r.address || '—'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 3 }}>
                          👤 <strong>{owner.name || '—'}</strong>
                          {owner.email && <span style={{ color: 'var(--text3)' }}> · {owner.email}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          Submitted: {a.requestedAt ? new Date(a.requestedAt).toLocaleString('en-IN') : '—'}
                          {a.reviewedAt ? ` · Reviewed: ${new Date(a.reviewedAt).toLocaleString('en-IN')}` : ''}
                        </div>
                        {a.adminNote && (
                          <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontStyle: 'italic' }}>
                            Admin note: {a.adminNote}
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                          <ActionBtn label="✓ Approve" onClick={() => approve(r.id, r.name)} color="#16A34A" id={`approve-${r.id}`}/>
                          <ActionBtn label="✕ Reject"  onClick={() => { setRejectModal({ restaurantId: r.id, name: r.name }); setRejectReason('') }} color="#EF4444" id={`reject-${r.id}`}/>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div>
            <SearchBar value={searchUsers} onChange={setSearchUsers} placeholder="Search by name or email..."/>
            {loading ? (
              <LoadingSkeleton count={4}/>
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon="👤" title="No users found" desc={searchUsers ? 'Try a different search term.' : 'No registered users yet.'}/>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUsers.map(u => {
                  const isBlocked = u.blocked === true || u.isBlocked === true
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'var(--surface)', border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius: 14, opacity: isBlocked ? 0.85 : 1, transition: 'all 0.2s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: u.role === 'BUSINESS' ? 'rgba(255,183,0,0.15)' : 'rgba(255,77,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {u.role === 'BUSINESS' ? '🏪' : '👤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{u.name}</span>
                          <span style={statusStyle(isBlocked ? 'BLOCKED' : 'ACTIVE')}>{isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
                          <span style={statusStyle(u.role)}>{u.role}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</div>
                        {u.phone && <div style={{ fontSize: 12, color: 'var(--text3)' }}>📞 {u.phone}</div>}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {isBlocked
                          ? <ActionBtn label="🔓 Unblock" onClick={() => toggleUser(u)} color="#16A34A" id={`user-${u.id}`}/>
                          : <ActionBtn label="🔒 Block"   onClick={() => toggleUser(u)} color="#EF4444" id={`user-${u.id}`}/>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RESTAURANTS TAB ── */}
        {tab === 'restaurants' && (
          <div>
            <SearchBar value={searchRests} onChange={setSearchRests} placeholder="Search restaurants..."/>
            {loading ? (
              <LoadingSkeleton count={4}/>
            ) : filteredRests.length === 0 ? (
              <EmptyState icon="🏪" title="No restaurants found" desc={searchRests ? 'Try a different search term.' : 'No restaurants registered yet.'}/>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRests.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'var(--surface)', border: `1px solid ${r.status === 'BLOCKED' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius: 14, opacity: r.status === 'BLOCKED' ? 0.85 : 1, transition: 'all 0.2s' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,77,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏪</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{r.name}</span>
                        <span style={statusStyle(r.status || 'PENDING')}>{r.status || 'PENDING'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>📍 {r.address}</div>
                      {r.owner && (
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          Owner: {r.owner.name}
                          {r.owner.email && <span> · {r.owner.email}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                      {r.status === 'PENDING' && (
                        <>
                          <ActionBtn label="✓ Approve" onClick={() => approve(r.id, r.name)} color="#16A34A" id={`approve-${r.id}`}/>
                          <ActionBtn label="✕ Reject"  onClick={() => { setRejectModal({ restaurantId: r.id, name: r.name }); setRejectReason('') }} color="#EF4444" id={`reject-inline-${r.id}`}/>
                        </>
                      )}
                      {(r.status === 'APPROVED' || r.status === 'REJECTED') && (
                        <ActionBtn label="🚫 Block"   onClick={() => toggleRestaurant(r)} color="#EF4444"  id={`rest-${r.id}`}/>
                      )}
                      {r.status === 'BLOCKED' && (
                        <ActionBtn label="🔓 Unblock" onClick={() => toggleRestaurant(r)} color="#16A34A" id={`rest-${r.id}`}/>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setRejectModal(null)}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, maxWidth: 440, width: '100%', animation: 'fadeUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>✕</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6, color: 'var(--text)' }}>Reject Restaurant</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              Rejecting <strong style={{ color: 'var(--text)' }}>{rejectModal.name}</strong>. The business owner will not be able to add food items.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                Reason (optional — shown to owner)
              </label>
              <input
                style={{ width: '100%', background: 'var(--input-bg)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                placeholder="e.g. Incomplete information, duplicate restaurant..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                onFocus={e  => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e   => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 14, color: 'var(--text2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button onClick={rejectConfirm} style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helper components ── */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '10px 14px', gap: 10, maxWidth: 420, marginBottom: 16, transition: 'border-color 0.2s' }}
      onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
      onBlurCapture={e  => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, color: 'var(--text)', outline: 'none' }} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}/>
      {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>}
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 16 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
      <p style={{ color: 'var(--text2)', fontSize: 14 }}>{desc}</p>
    </div>
  )
}

function LoadingSkeleton({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 80, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }}/>
      ))}
    </div>
  )
}
