import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import BottomNav from './components/common/BottomNav'
import SplashScreen, { shouldShow as splashWillShow } from './components/common/SplashScreen'
import PrivateRoute from './components/common/PrivateRoute'
import AdminRoute from './components/common/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'

import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import OrderHistory from './pages/OrderHistory'
import OrderConfirmation from './pages/OrderConfirmation'
import AddressBook from './pages/AddressBook'
import NotFound from './pages/NotFound'

import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import ManageProducts from './pages/admin/ManageProducts'
import ProductForm from './pages/admin/ProductForm'
import ManageCategories from './pages/admin/ManageCategories'
import ManageOrders from './pages/admin/ManageOrders'
import ManageUsers from './pages/admin/ManageUsers'
import ManageReviews from './pages/admin/ManageReviews'
import ManageCoupons from './pages/admin/ManageCoupons'
import ManageReturns from './pages/admin/ManageReturns'

const isLocalhost = window.location.hostname === 'localhost'

const StorefrontLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1 pb-16 md:pb-0">{children}</main>
    <Footer />
    <BottomNav />
  </div>
)

function App() {
  const [routesReady, setRoutesReady] = useState(!splashWillShow)

  useEffect(() => {
    if (splashWillShow) {
      const t = setTimeout(() => setRoutesReady(true), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  const appRoutes = routesReady ? (
    <Routes>
      {isLocalhost && (
        <>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="orders" element={<ManageOrders />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="reviews" element={<ManageReviews />} />
            <Route path="coupons" element={<ManageCoupons />} />
            <Route path="returns" element={<ManageReturns />} />
          </Route>
        </>
      )}
      <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
      <Route path="/products" element={<StorefrontLayout><ProductList /></StorefrontLayout>} />
      <Route path="/products/:id" element={<StorefrontLayout><ProductDetails /></StorefrontLayout>} />
      <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
      <Route path="/login" element={<StorefrontLayout><Login /></StorefrontLayout>} />
      <Route path="/register" element={<StorefrontLayout><Register /></StorefrontLayout>} />
      <Route path="/forgot-password" element={<StorefrontLayout><ForgotPassword /></StorefrontLayout>} />
      <Route path="/wishlist" element={<StorefrontLayout><PrivateRoute><Wishlist /></PrivateRoute></StorefrontLayout>} />
      <Route path="/checkout" element={<StorefrontLayout><PrivateRoute><Checkout /></PrivateRoute></StorefrontLayout>} />
      <Route path="/profile" element={<StorefrontLayout><PrivateRoute><Profile /></PrivateRoute></StorefrontLayout>} />
      <Route path="/orders" element={<StorefrontLayout><PrivateRoute><OrderHistory /></PrivateRoute></StorefrontLayout>} />
      <Route path="/order-confirmation/:orderId" element={<StorefrontLayout><PrivateRoute><OrderConfirmation /></PrivateRoute></StorefrontLayout>} />
      <Route path="/profile/addresses" element={<StorefrontLayout><PrivateRoute><AddressBook /></PrivateRoute></StorefrontLayout>} />
      <Route path="*" element={<StorefrontLayout><NotFound /></StorefrontLayout>} />
    </Routes>
  ) : null

  return (
    <>
      <SplashScreen />
      {appRoutes}
    </>
  )
}

export default App
