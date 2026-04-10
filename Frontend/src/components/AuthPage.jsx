import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

// Local map: email → role, so login knows the correct role
// (Backend login response is just a string, not a user object)
const saveRoleForEmail = (email, role) => {
  try {
    const map = JSON.parse(localStorage.getItem('nomzee_role_map') || '{}')
    map[email] = role
    localStorage.setItem('nomzee_role_map', JSON.stringify(map))
  } catch {}
}

const getRoleForEmail = (email) => {
  try {
    const map = JSON.parse(localStorage.getItem('nomzee_role_map') || '{}')
    return map[email] || 'CUSTOMER'
  } catch {
    return 'CUSTOMER'
  }
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
        const res = await axios.post(
          '/auth/login',
          { email: form.email, password: form.password },
          { withCredentials: true }
        )
        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

        if (text.toLowerCase().includes('success') || text.toLowerCase().includes('login')) {
          const role = getRoleForEmail(form.email) // look up saved role
          setMessage({ type: 'success', text: 'Logged in! Redirecting...' })
          onLogin({
            name: form.email.split('@')[0],
            email: form.email,
            role,
          })
          // Send BUSINESS to dashboard, CUSTOMER to menu
          setTimeout(() => navigate(role === 'BUSINESS' ? '/dashboard' : '/menu'), 700)
        } else {
          setMessage({ type: 'error', text: text || 'Invalid credentials' })
        }
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }
        if (form.role === 'CUSTOMER') {
          payload.phone = form.phone
          payload.address = form.address
        }

        const res = await axios.post('/auth/register', payload)
        const text = typeof res.data === 'string' ? res.data : 'Registered successfully!'

        // Save email → role so login can read it later
        saveRoleForEmail(form.email, form.role)

        setMessage({ type: 'success', text: text + ' Please sign in.' })
        setTimeout(() => navigate('/login'), 1400)
      }
    } catch (err) {
      const errData = err.response?.data
      const errMsg = typeof errData === 'string'
        ? errData
        : (errData?.message || 'Server error. Make sure the backend is running on port 8080.')
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo_nomzee.png" alt="NOMZEE" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', marginBottom: 14 }} />
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
              <input name="name" type="text" placeholder="e.g. John Doe"
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
