import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { getCategories } from '../../api/categoryApi'
import CategoryBar from './CategoryBar'
import SearchBar from './SearchBar'
import Logo from './Logo'

/* ─── Icon helpers ─────────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)
const IconCart = ({ cls = 'w-5 h-5' }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.954-4.749 2.466-7.305a1.125 1.125 0 00-1.105-1.345H5.106M7.5 14.25L5.106 5.272M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm9.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
)
const IconHeart = ({ cls = 'w-5 h-5' }) => (
  <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
)
const IconOrders = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
)
const IconGrid = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)
const IconProfile = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)
const IconLogout = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)
const IconLoginIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)
const IconMapPin = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
)

const Navbar = () => {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerCats, setDrawerCats]     = useState([])
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const SEARCH_PLACEHOLDERS = [
    'Search sarees...',
    'Search kurtis...',
    'Search jewellery...',
  ]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [mobileSearchPlaceholder, setMobileSearchPlaceholder] = useState(SEARCH_PLACEHOLDERS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => {
        const next = (prev + 1) % SEARCH_PLACEHOLDERS.length
        setMobileSearchPlaceholder(SEARCH_PLACEHOLDERS[next])
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const { user, isAuthenticated, logout } = useAuth()
  const { cartCount } = useCart()
  const { wishlist, isWishlisted, toggleWishlist } = useWishlist()
  const navigate = useNavigate()

  // Categories for mobile drawer; CategoryBar fetches its own copy for tablet/desktop
  useEffect(() => {
    getCategories().then(r => setDrawerCats(r.data.categories)).catch(() => {})
  }, [])

  // Profile photo (saved in Profile → localStorage). Refresh instantly on "avatar_updated".
  const [avatarUrl, setAvatarUrl] = useState(null)
  useEffect(() => {
    const refresh = () => {
      const saved = localStorage.getItem(`shivora_avatar_${user?.id}`)
      setAvatarUrl(saved || null)
    }
    refresh()
    window.addEventListener('avatar_updated', refresh)
    return () => window.removeEventListener('avatar_updated', refresh)
  }, [user?.id])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
    setUserMenuOpen(false)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    closeMenu()
    navigate('/')
  }

  const initials = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
    <header className="bg-surface border-b border-surface-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">

        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center h-16 gap-3">

          <Logo />

          {/* Search bar
              mobile (< md):  hidden — search icon expands a row below
              tablet (md–lg): condensed (max-w-sm)
              desktop (lg+):  wide    (max-w-xl)                            */}
          <SearchBar className="hidden md:block flex-1 max-w-sm lg:max-w-xl" />

          {/* Spacer — pushes icons to the right on mobile */}
          <div className="flex-1 md:hidden" />

          {/* ── Desktop nav (lg+) ─────────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-5 flex-shrink-0">
            <Link to="/products"
              className="text-sm font-medium text-silver-muted hover:text-parchment transition-colors">
              Products
            </Link>

            {isAuthenticated && (
              <Link to="/orders"
                className="text-sm font-medium text-silver-muted hover:text-parchment transition-colors">
                My Orders
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/wishlist" title="Wishlist"
                className="text-silver-muted hover:text-gold transition-colors">
                <IconHeart cls="w-6 h-6" />
              </Link>
            )}

            <Link to="/cart" title="Cart"
              className="relative text-silver-muted hover:text-gold transition-colors">
              <IconCart cls="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-[#0A0A0B] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(v => !v)}
                  className="text-silver-muted hover:text-parchment transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-yellow-500/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-raised border border-gold/40 text-gold flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-surface-raised rounded-lg shadow-xl border border-surface-border py-1 z-20">
                      <p className="px-4 py-2 text-sm text-silver-dim border-b border-surface-border truncate">
                        {user?.email}
                      </p>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-silver-muted hover:bg-surface hover:text-parchment transition-colors">
                        My Profile
                      </Link>
                      <Link to="/profile/addresses" onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-silver-muted hover:bg-surface hover:text-parchment transition-colors">
                        My Addresses
                      </Link>
                      <button onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary !py-2 !px-4 text-sm">Login</Link>
            )}
          </nav>

          {/* ── Mobile + tablet icon strip (hidden on lg+) ────────────────── */}
          <div className="flex items-center gap-1 lg:hidden flex-shrink-0">

            {/* Wishlist */}
            <Link to="/wishlist" className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-silver-dim hover:text-parchment transition-colors">
              <svg className="w-5 h-5" fill={wishlist.length > 0 ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Profile avatar — visible on all mobile/tablet sizes */}
            {isAuthenticated && (
              <Link to="/profile" className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-gold/40" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" aria-label="Cart"
              className="relative min-w-[44px] min-h-[44px] hidden md:flex items-center justify-center text-silver-muted hover:text-gold transition-colors">
              <IconCart />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 bg-gold text-[#0A0A0B] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-silver-muted hover:text-gold transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* ── Mobile search bar (always visible, hidden md+) ───────────────── */}
        <div className="md:hidden px-3 pb-2">
          <SearchBar placeholder={mobileSearchPlaceholder} />
        </div>
      </div>

      {/* ── Category bar — tablet + desktop only ─────────────────────────────── */}
      {/* Mobile gets categories inside the drawer                               */}
      <div className="hidden md:block">
        <CategoryBar />
      </div>

      {/* ── Mobile / tablet slide-in drawer ──────────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={closeMenu} />

          {/* Panel */}
          <div
            className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-surface border-l border-surface-border z-50 flex flex-col lg:hidden"
            style={{ animation: 'drawer-in 0.22s cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border flex-shrink-0">
              <Logo />
              <button onClick={closeMenu} aria-label="Close menu"
                className="p-1.5 text-silver-muted hover:text-parchment transition-colors">
                <IconClose />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto py-3">
              <nav className="flex flex-col px-3 gap-0.5">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconProfile />Profile
                    </Link>
                    <Link to="/profile/addresses" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconMapPin />My Addresses
                    </Link>
                    <Link to="/products" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconGrid />Products
                    </Link>
                    <Link to="/orders" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconOrders />My Orders
                    </Link>
                    <Link to="/wishlist" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconHeart cls="w-4 h-4 flex-shrink-0" />Wishlist
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-lg transition-colors w-full text-left">
                      <IconLogout />Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/products" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-silver-muted hover:bg-surface-raised hover:text-parchment rounded-lg transition-colors">
                      <IconGrid />Products
                    </Link>
                    <Link to="/login" onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gold hover:bg-gold/10 rounded-lg transition-colors">
                      <IconLoginIcon />Login / Register
                    </Link>
                  </>
                )}
              </nav>

            </div>

            {/* Drawer footer — user summary */}
            {isAuthenticated && (
              <div className="flex-shrink-0 px-4 py-3 border-t border-surface-border bg-surface-raised">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-gold/40 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-parchment truncate">{user?.name}</p>
                    <p className="text-xs text-silver-dim truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-raised border border-surface-border rounded-xl p-6 w-80 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">Logout</h2>
            <p className="text-silver-dim text-sm mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-surface-border text-silver-dim hover:bg-surface-border transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold transition-colors text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
