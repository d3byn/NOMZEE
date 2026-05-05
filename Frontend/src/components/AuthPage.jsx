import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

// Only needed for registering new users — maps email→role for the register flow
const saveRoleForEmail = (email, role) => {
  try {
    const map = JSON.parse(localStorage.getItem('nomzee_role_map') || '{}')
    map[email] = role
    localStorage.setItem('nomzee_role_map', JSON.stringify(map))
  } catch {}
}

export default function AuthPage({ mode, onLogin }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'CUSTOMER', phone: '', address: '',
  })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        // ── LOGIN ─────────────────────────────────────────────────────────
        // Step 1: do the login call
        const loginRes = await axios.post('/auth/login',
          { email: form.email, password: form.password },
          { withCredentials: true }
        )
        const loginText = typeof loginRes.data === 'string'
          ? loginRes.data : JSON.stringify(loginRes.data)

        // Handle blocked
        if (loginText.toLowerCase().includes('blocked')) {
          setMessage({ type: 'error', text: loginText })
          setLoading(false)
          return
        }

        if (!loginText.toLowerCase().includes('success') &&
            !loginText.toLowerCase().includes('login')) {
          setMessage({ type: 'error', text: loginText || 'Invalid credentials' })
          setLoading(false)
          return
        }

        // Step 2: fetch the actual logged-in user from backend to get REAL role
        // This is the key fix — we don't rely on localStorage for role anymore
        let userData = null
        try {
          const meRes = await axios.get('/auth/me', { withCredentials: true })
          userData = meRes.data  // { id, name, email, role, ... }
        } catch {
          // /auth/me not yet implemented — fall back to localStorage map
          const savedMap = JSON.parse(localStorage.getItem('nomzee_role_map') || '{}')
          const role = savedMap[form.email] || 'CUSTOMER'
          userData = { name: form.email.split('@')[0], email: form.email, role }
        }

        const role = userData.role || 'CUSTOMER'
        setMessage({ type: 'success', text: `Logged in as ${role}! Redirecting...` })

        onLogin({
          id:    userData.id,
          name:  userData.name || form.email.split('@')[0],
          email: userData.email || form.email,
          role,
        })

        const dest = role === 'ADMIN' ? '/admin'
                   : role === 'BUSINESS' ? '/dashboard'
                   : '/menu'
        setTimeout(() => navigate(dest), 700)

      } else {
        // ── REGISTER ──────────────────────────────────────────────────────
        const payload = {
          name:     form.name,
          email:    form.email,
          password: form.password,
          role:     form.role,
        }
        if (form.role === 'CUSTOMER') {
          payload.phone   = form.phone
          payload.address = form.address
        }

        const res  = await axios.post('/auth/register', payload)
        const text = typeof res.data === 'string' ? res.data : 'Registered successfully!'

        // Save role so login can fall back if /auth/me isn't implemented yet
        saveRoleForEmail(form.email, form.role)

        setMessage({ type: 'success', text: text + ' Please sign in.' })
        setTimeout(() => navigate('/login'), 1400)
      }
    } catch (err) {
      const errData = err.response?.data
      const errMsg  = typeof errData === 'string'
        ? errData
        : (errData?.message || 'Server error. Make sure backend is running.')
      setMessage({ type: 'error', text: errMsg })
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo_nomzee.png" alt="NOMZEE"
            style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', marginBottom: 14 }} />
          <h1>{isLogin ? 'Welcome back!' : 'Join NOMZEE'}</h1>
          <p>{isLogin ? 'Sign in to continue' : 'Create your free account'}</p>
        </div>

        {message && (
          <div className={`auth-message ${message.type}`}>{message.text}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" type="text" placeholder="e.g. Anuja"
                value={form.name} onChange={handleChange} required />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Enter password"
              value={form.password} onChange={handleChange} required />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Account Type</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="CUSTOMER">Customer</option>
                  <option value="BUSINESS">Business / Restaurant Owner</option>
                </select>
              </div>

              {form.role === 'CUSTOMER' && (
                <>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone" type="tel" placeholder="9999999999"
                      value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Address</label>
                    <input name="address" type="text" placeholder="e.g. Kolkata"
                      value={form.address} onChange={handleChange} />
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin
            ? (<>Don't have an account? <Link to="/register">Sign up</Link></>)
            : (<>Already have an account? <Link to="/login">Sign in</Link></>)
          }
        </div>
      </div>
    </div>
  )
}
