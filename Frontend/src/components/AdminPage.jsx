import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const statusStyle = (status) => {
  const map = {
    PENDING:  { bg:'rgba(255,183,0,0.1)',  border:'rgba(255,183,0,0.3)',  text:'#FFB700' },
    APPROVED: { bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.25)', text:'var(--success)' },
    REJECTED: { bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)', text:'#EF4444' },
    BLOCKED:  { bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)', text:'#EF4444' },
    ACTIVE:   { bg:'rgba(34,197,94,0.08)', border:'rgba(34,197,94,0.2)',  text:'var(--success)' },
  }
  const c = map[status] || map.PENDING
  return { display:'inline-block', padding:'3px 10px', borderRadius:7, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', background:c.bg, border:`1px solid ${c.border}`, color:c.text }
}

export default function AdminPage({ user, toast }) {
  const navigate = useNavigate()
  const [tab,            setTab]            = useState('approvals')
  const [approvals,      setApprovals]      = useState([])
  const [users,          setUsers]          = useState([])
  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [actionLoading,  setActionLoading]  = useState(null)
  const [rejectModal,    setRejectModal]    = useState(null)
  const [rejectReason,   setRejectReason]   = useState('')
  const [searchUsers,    setSearchUsers]    = useState('')
  const [searchRests,    setSearchRests]    = useState('')

  if (!user || user.role !== 'ADMIN') { navigate('/'); return null }

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, u, r] = await Promise.all([
        axios.get('/admin/all-approvals',   { withCredentials:true }),
        axios.get('/admin/all-users',        { withCredentials:true }),
        axios.get('/admin/all-restaurants',  { withCredentials:true }),
      ])
      setApprovals(Array.isArray(a.data) ? a.data : [])
      setUsers(Array.isArray(u.data) ? u.data : [])
      setRestaurants(Array.isArray(r.data) ? r.data : [])
    } catch { toast('Failed to load admin data', 'error') }
    finally { setLoading(false) }
  }

  const approve = async (restaurantId, name) => {
    setActionLoading(`approve-${restaurantId}`)
    try {
      await axios.post(`/admin/approve-restaurant/${restaurantId}`, {}, { withCredentials:true })
      toast(`✓ "${name}" approved! Owner can now add food items.`, 'success')
      fetchAll()
    } catch { toast('Failed to approve', 'error') }
    finally { setActionLoading(null) }
  }

  const rejectConfirm = async () => {
    if (!rejectModal) return
    setActionLoading(`reject-${rejectModal.restaurantId}`)
    try {
      await axios.post(`/admin/reject-restaurant/${rejectModal.restaurantId}`, { reason:rejectReason }, { withCredentials:true })
      toast(`"${rejectModal.name}" rejected.`, 'info')
      setRejectModal(null); setRejectReason('')
      fetchAll()
    } catch { toast('Failed to reject', 'error') }
    finally { setActionLoading(null) }
  }

  const toggleRestaurant = async (r) => {
    const isBlocked = r.status === 'BLOCKED'
    setActionLoading(`rest-${r.id}`)
    try {
      await axios.post(`/admin/${isBlocked ? 'unblock' : 'block'}-restaurant/${r.id}`, {}, { withCredentials:true })
      toast(`"${r.name}" ${isBlocked ? 'unblocked' : 'blocked'}.`, isBlocked ? 'success' : 'info')
      fetchAll()
    } catch { toast('Action failed', 'error') }
    finally { setActionLoading(null) }
  }

  const toggleUser = async (u) => {
    setActionLoading(`user-${u.id}`)
    try {
      await axios.post(`/admin/${u.blocked ? 'unblock' : 'block'}-user/${u.id}`, {}, { withCredentials:true })
      toast(`User "${u.name}" ${u.blocked ? 'unblocked' : 'blocked'}.`, u.blocked ? 'success' : 'info')
      fetchAll()
    } catch { toast('Action failed', 'error') }
    finally { setActionLoading(null) }
  }

  const pendingCount  = approvals.filter(a => a.status === 'PENDING').length
  const blockedUsers  = users.filter(u => u.blocked).length
  const nonAdminUsers = users.filter(u => u.role !== 'ADMIN')

  const filteredUsers = nonAdminUsers.filter(u =>
    !searchUsers ||
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredRests = restaurants.filter(r =>
    !searchRests || r.name?.toLowerCase().includes(searchRests.toLowerCase())
  )

  const ActionBtn = ({ label, onClick, color, id }) => {
    const busy = actionLoading === id
    return (
      <button onClick={onClick} disabled={busy} style={{ background:color||'var(--primary)', color:'white', border:'none', borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:600, cursor:busy?'not-allowed':'pointer', opacity:busy?0.6:1, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
        {busy && <div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
        {label}
      </button>
    )
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'120px 0' }}>
      <div className="loader"/>
    </div>
  )

  const TABS = [
    { key:'approvals',   label:`🏪 Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key:'users',       label:`👤 Users (${nonAdminUsers.length})` },
    { key:'restaurants', label:`🍽️ Restaurants (${restaurants.length})` },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-container page-header-inner">
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p className="page-subtitle">Platform-wide management</p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            {[
              { label:'Pending',     value:pendingCount,       color:'#FFB700' },
              { label:'Blocked',     value:blockedUsers,        color:'#EF4444' },
              { label:'Restaurants', value:restaurants.length, color:'var(--success)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 18px' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding:'28px 24px 80px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:5, width:'fit-content', marginBottom:28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'9px 20px', borderRadius:9, fontSize:14, fontWeight:600, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s', background: tab === t.key ? (t.key === 'approvals' && pendingCount > 0 ? '#FFB700' : 'var(--primary)') : 'transparent', color: tab === t.key ? 'white' : 'var(--text2)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <div style={{ marginBottom:20, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={fetchAll} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, padding:'8px 16px', fontSize:13, color:'var(--text2)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}
          >↻ Refresh</button>
        </div>

        {/* ── APPROVALS TAB ── */}
        {tab === 'approvals' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {approvals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h3>No approval requests yet</h3>
                <p>When business owners register restaurants, they'll appear here.</p>
              </div>
            ) : (
              approvals.map(a => {
                const r     = a.restaurant || {}
                const owner = a.requestedBy || {}
                const isPending = a.status === 'PENDING'
                return (
                  <div key={a.id} style={{ background:'var(--surface)', border:`1px solid ${isPending ? 'rgba(255,183,0,0.3)' : 'var(--border)'}`, borderRadius:16, padding:24, animation:'fadeUp 0.3s ease', transition:'border-color 0.2s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:'var(--text)' }}>{r.name || 'Unnamed Restaurant'}</span>
                          <span style={statusStyle(a.status)}>{a.status}</span>
                        </div>
                        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>📍 {r.address || '—'}</div>
                        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>
                          👤 Owner: <strong>{owner.name || '—'}</strong>
                          {owner.email && <span style={{ color:'var(--text3)' }}> ({owner.email})</span>}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>
                          Submitted: {a.requestedAt ? new Date(a.requestedAt).toLocaleString('en-IN') : '—'}
                          {a.reviewedAt && ` · Reviewed: ${new Date(a.reviewedAt).toLocaleString('en-IN')}`}
                        </div>
                        {a.adminNote && (
                          <div style={{ fontSize:12, color:'#EF4444', marginTop:6, fontStyle:'italic' }}>
                            Reason: {a.adminNote}
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                          <ActionBtn label="✓ Approve" onClick={() => approve(r.id, r.name)} color="var(--success)" id={`approve-${r.id}`}/>
                          <ActionBtn label="✕ Reject"  onClick={() => { setRejectModal({ restaurantId:r.id, name:r.name }); setRejectReason('') }} color="#EF4444" id={`reject-${r.id}`}/>
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
            <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 14px', gap:10, maxWidth:400, marginBottom:20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ flex:1, background:'none', border:'none', fontSize:14, color:'var(--text)' }} placeholder="Search users by name or email..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}/>
              {searchUsers && <button onClick={() => setSearchUsers('')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>✕</button>}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">👤</span><p>No users found</p></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredUsers.map(u => (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'var(--surface)', border:`1px solid ${u.blocked ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius:14, opacity:u.blocked?0.85:1, transition:'all 0.2s' }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:u.role==='BUSINESS'?'rgba(255,183,0,0.15)':'rgba(255,77,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                      {u.role === 'BUSINESS' ? '🏪' : '👤'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                        <span style={{ color:'var(--text)' }}>{u.name}</span>
                        <span style={statusStyle(u.blocked ? 'BLOCKED' : 'ACTIVE')}>{u.blocked ? 'BLOCKED' : 'ACTIVE'}</span>
                        <span style={statusStyle(u.role === 'BUSINESS' ? 'PENDING' : 'APPROVED')}>{u.role}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{u.email}</div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      {u.blocked
                        ? <ActionBtn label="🔓 Unblock" onClick={() => toggleUser(u)} color="var(--success)" id={`user-${u.id}`}/>
                        : <ActionBtn label="🔒 Block"   onClick={() => toggleUser(u)} color="#EF4444"     id={`user-${u.id}`}/>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESTAURANTS TAB ── */}
        {tab === 'restaurants' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 14px', gap:10, maxWidth:400, marginBottom:20 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ flex:1, background:'none', border:'none', fontSize:14, color:'var(--text)' }} placeholder="Search restaurants..." value={searchRests} onChange={e => setSearchRests(e.target.value)}/>
              {searchRests && <button onClick={() => setSearchRests('')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>✕</button>}
            </div>

            {filteredRests.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">🏪</span><p>No restaurants found</p></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredRests.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'var(--surface)', border:`1px solid ${r.status==='BLOCKED'?'rgba(239,68,68,0.25)':'var(--border)'}`, borderRadius:14, transition:'all 0.2s', opacity:r.status==='BLOCKED'?0.85:1 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,77,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏪</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                        <span style={{ color:'var(--text)' }}>{r.name}</span>
                        <span style={statusStyle(r.status||'PENDING')}>{r.status||'PENDING'}</span>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>📍 {r.address}</div>
                      {r.owner && <div style={{ fontSize:12, color:'var(--text3)' }}>Owner: {r.owner.name} ({r.owner.email})</div>}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end', flexShrink:0 }}>
                      {r.status === 'PENDING' && <>
                        <ActionBtn label="✓ Approve" onClick={() => approve(r.id, r.name)} color="var(--success)" id={`approve-${r.id}`}/>
                        <ActionBtn label="✕ Reject"  onClick={() => { setRejectModal({ restaurantId:r.id, name:r.name }); setRejectReason('') }} color="#EF4444" id={`noop`}/>
                      </>}
                      {(r.status === 'APPROVED' || r.status === 'REJECTED') &&
                        <ActionBtn label="🚫 Block"   onClick={() => toggleRestaurant(r)} color="#EF4444"     id={`rest-${r.id}`}/>
                      }
                      {r.status === 'BLOCKED' &&
                        <ActionBtn label="🔓 Unblock" onClick={() => toggleRestaurant(r)} color="var(--success)" id={`rest-${r.id}`}/>
                      }
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
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setRejectModal(null)}
        >
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:36, maxWidth:440, width:'100%', animation:'fadeUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize:36, textAlign:'center', marginBottom:12 }}>✕</div>
            <h3 style={{ fontSize:20, fontWeight:700, textAlign:'center', marginBottom:6, color:'var(--text)' }}>Reject Restaurant</h3>
            <p style={{ color:'var(--text2)', fontSize:14, textAlign:'center', marginBottom:20 }}>
              Rejecting <strong>{rejectModal.name}</strong>. The owner will be notified.
            </p>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:8 }}>Reason (optional)</label>
              <input
                style={{ width:'100%', background:'var(--input-bg)', border:'1.5px solid var(--border)', borderRadius:10, padding:'12px 14px', color:'var(--text)', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}
                placeholder="e.g. Incomplete information, invalid address..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                onFocus={e => e.target.style.borderColor='var(--primary)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px', fontSize:14, color:'var(--text2)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button onClick={rejectConfirm} style={{ flex:1, background:'#EF4444', color:'white', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
