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

import './App.css'

export default function App() {
  const [user,         setUser]         = useState(null)
  const [foods,        setFoods]        = useState([])
  const [foodsLoading, setFoodsLoading] = useState(true)
  const [cartCount,    setCartCount]    = useState(0)
  const [toast,        setToast]        = useState(null)

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('nomzee_user')
    if (saved) { try { setUser(JSON.parse(saved)) } catch {} }
  }, [])

  // Sync cart count from backend on login
  const syncCartCount = useCallback(async () => {
    try {
      const res = await axios.get('/cart/view', { withCredentials: true })
      const items = Array.isArray(res.data) ? res.data : []
      setCartCount(items.length)
    } catch { setCartCount(0) }
  }, [])

  useEffect(() => {
    if (user?.role === 'CUSTOMER') syncCartCount()
  }, [user, syncCartCount])

  // Fetch all foods
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
    setTimeout(() => setToast(null), 3200)
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

  // Called after order is placed — resets cart badge to 0
  const handleOrderPlaced = () => {
    setCartCount(0)
  }

  // POST /cart/add  body: { foodId, qty }
  // qty is always 1 per click — user sets quantity with the +/- in the card
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

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar user={user} cartCount={cartCount} onLogout={handleLogout} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Welcome user={user} foods={foods} />} />

            <Route path="/menu" element={
              <MenuPage
                user={user}
                foods={foods}
                loading={foodsLoading}
                onAddToCart={handleAddToCart}
                onFoodsUpdated={fetchFoods}
              />
            } />

            <Route path="/cart" element={
              user?.role === 'CUSTOMER'
                ? <CartPage user={user} toast={showToast} onOrderPlaced={handleOrderPlaced} />
                : <Navigate to="/" />
            } />

            <Route path="/orders" element={
              user?.role === 'CUSTOMER'
                ? <OrdersPage user={user} />
                : <Navigate to="/" />
            } />

            <Route path="/dashboard" element={
              user?.role === 'BUSINESS'
                ? <DashboardPage user={user} onFoodsUpdated={fetchFoods} toast={showToast} />
                : <Navigate to="/" />
            } />

            <Route path="/restaurant" element={<Navigate to="/dashboard" />} />

            <Route path="/login" element={
              user ? <Navigate to={user.role === 'BUSINESS' ? '/dashboard' : '/'} /> : <AuthPage mode="login" onLogin={handleLogin} />
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
