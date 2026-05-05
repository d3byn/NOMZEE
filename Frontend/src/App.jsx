import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Welcome from './components/Welcome'
import MenuPage from './components/MenuPage'
import CartPage from './components/CartPage'
import OrdersPage from './components/OrdersPage'
import AuthPage from './components/AuthPage'
import DashboardPage from './components/DashboardPage'
import AdminPage from './components/AdminPage'

import './App.css'

export default function App() {
  const [user,         setUser]         = useState(null)
  const [foods,        setFoods]        = useState([])
  const [foodsLoading, setFoodsLoading] = useState(true)
  const [cartCount,    setCartCount]    = useState(0)
  const [toast,        setToast]        = useState(null)
  const [theme,        setTheme]        = useState(() => localStorage.getItem('nomzee_theme') || 'dark')

  // ── Apply theme ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nomzee_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── Restore session — then verify with backend to get REAL role ─────────────
  useEffect(() => {
    const saved = localStorage.getItem('nomzee_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        // Silently verify the session is still valid and role is correct
        axios.get('/auth/me', { withCredentials: true })
          .then(res => {
            const fresh = res.data
            if (fresh?.role) {
              // Update stored user with fresh role from DB
              const updated = { ...parsed, role: fresh.role, name: fresh.name || parsed.name, id: fresh.id }
              setUser(updated)
              localStorage.setItem('nomzee_user', JSON.stringify(updated))
            }
          })
          .catch(() => {
            // Session expired — clear and force re-login
            setUser(null)
            localStorage.removeItem('nomzee_user')
          })
      } catch { localStorage.removeItem('nomzee_user') }
    }
  }, [])

  const syncCartCount = useCallback(async () => {
    try {
      const res = await axios.get('/cart/view', { withCredentials: true })
      setCartCount(Array.isArray(res.data) ? res.data.length : 0)
    } catch { setCartCount(0) }
  }, [])

  useEffect(() => {
    if (user?.role === 'CUSTOMER') syncCartCount()
  }, [user, syncCartCount])

  const fetchFoods = useCallback(async () => {
    setFoodsLoading(true)
    try {
      const res = await axios.get('/food/all')
      setFoods(Array.isArray(res.data) ? res.data : [])
    } catch { setFoods([]) }
    finally { setFoodsLoading(false) }
  }, [])

  useEffect(() => { fetchFoods() }, [fetchFoods])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('nomzee_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setCartCount(0)
    localStorage.removeItem('nomzee_user')
    showToast('Signed out successfully')
  }

  const handleOrderPlaced = () => setCartCount(0)

  const handleAddToCart = async (foodId, qty) => {
    try {
      await axios.post('/cart/add', { foodId, qty }, { withCredentials: true })
      setCartCount(c => c + qty)
      showToast('Added to cart! 🛒', 'success')
    } catch (err) {
      const msg = err.response?.data
      showToast(typeof msg === 'string' ? msg : 'Failed to add to cart', 'error')
    }
  }

  const role = user?.role

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar
          user={user}
          cartCount={cartCount}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Welcome user={user} foods={foods} />} />

            <Route path="/menu" element={
              <MenuPage user={user} foods={foods} loading={foodsLoading} onAddToCart={handleAddToCart} />
            } />

            <Route path="/cart" element={
              role === 'CUSTOMER'
                ? <CartPage user={user} toast={showToast} onOrderPlaced={handleOrderPlaced} />
                : <Navigate to="/login" />
            } />

            <Route path="/orders" element={
              role === 'CUSTOMER' ? <OrdersPage user={user} /> : <Navigate to="/login" />
            } />

            <Route path="/dashboard" element={
              role === 'BUSINESS'
                ? <DashboardPage user={user} onFoodsUpdated={fetchFoods} toast={showToast} />
                : <Navigate to="/" />
            } />

            <Route path="/admin" element={
              role === 'ADMIN'
                ? <AdminPage user={user} toast={showToast} />
                : <Navigate to="/" />
            } />

            <Route path="/restaurant" element={<Navigate to="/dashboard" />} />

            <Route path="/login" element={
              !user ? <AuthPage mode="login" onLogin={handleLogin} />
                    : role === 'ADMIN' ? <Navigate to="/admin" />
                    : role === 'BUSINESS' ? <Navigate to="/dashboard" />
                    : <Navigate to="/" />
            } />

            <Route path="/register" element={
              user ? <Navigate to="/" /> : <AuthPage mode="register" onLogin={handleLogin} />
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />

        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✓ ' : toast.type === 'error' ? '✕ ' : 'ℹ '}
            {toast.msg}
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}
