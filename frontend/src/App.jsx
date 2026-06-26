import React, { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import BottomNav from './components/common/BottomNav'
import SplashScreen, { shouldShow as splashWillShow } from './components/common/SplashScreen'
import PrivateRoute from './components/common/PrivateRoute'
import AdminRoute from './components/common/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import PageLoader from './components/common/PageLoader'

// Lazy-loaded storefront pages
const Home             = lazy(() => import('./pages/Home'))
const ProductList      = lazy(() => import('./pages/ProductList'))
const ProductDetails   = lazy(() => import('./pages/ProductDetails'))
const Cart             = lazy(() => import('./pages/Cart'))
const Wishlist         = lazy(() => import('./pages/Wishlist'))
const Checkout         = lazy(() => import('./pages/Checkout'))
const Login            = lazy(() => import('./pages/Login'))
const Register         = lazy(() => import('./pages/Register'))
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'))
const Profile          = lazy(() => import('./pages/Profile'))
const OrderHistory     = lazy(() => import('./pages/OrderHistory'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const AddressBook      = lazy(() => import('./pages/AddressBook'))
const NotFound         = lazy(() => import('./pages/NotFound'))

// Lazy-loaded admin pages
const AdminLogin       = lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard        = lazy(() => import('./pages/admin/Dashboard'))
const ManageProducts   = lazy(() => import('./pages/admin/ManageProducts'))
const ProductForm      = lazy(() => import('./pages/admin/ProductForm'))
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'))
const ManageOrders     = lazy(() => import('./pages/admin/ManageOrders'))
const ManageUsers      = lazy(() => import('./pages/admin/ManageUsers'))
const ManageReviews    = lazy(() => import('./pages/admin/ManageReviews'))
const ManageCoupons    = lazy(() => import('./pages/admin/ManageCoupons'))
const ManageReturns    = lazy(() => import('./pages/admin/ManageReturns'))

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  ) : null

  return (
    <>
      <SplashScreen />
      {appRoutes}
    </>
  )
}

export default App
