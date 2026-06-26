import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword } from '../api/userApi'
import { getOrderHistory } from '../api/orderApi'
import { getWishlist } from '../api/wishlistApi'
import { getAddresses, deleteAddress, setDefaultAddress } from '../api/addressApi'
import { API_ORIGIN } from '../api/axiosInstance'
import AddressFormModal from '../components/AddressFormModal'
import ProductCard from '../components/product/ProductCard'
import OrderTimeline from '../components/order/OrderTimeline'

const FRAUNCES = { fontFamily: "'Fraunces', Georgia, serif" }

// Warm-gold form input styling (overrides the base .input-field colors only)
const inputCls = 'input-field !py-3 !px-4 !text-base !bg-white/[0.03] !border-[rgba(245,158,11,0.15)] !text-white/80 placeholder:!text-white/20 focus:!border-[rgba(245,158,11,0.5)]'

// All sidebar entries render inline now (no navigating away).
const NAV = [
  { key: 'overview', label: 'My Account' },
  { key: 'details', label: 'Profile Details' },
  { key: 'addresses', label: 'My Addresses' },
  { key: 'password', label: 'Change Password' },
  { key: 'orders', label: 'My Orders' },
  { key: 'wishlist', label: 'My Wishlist' },
]

const ORDER_STATUS = {
  pending:    { label: 'Pending',   badge: 'bg-[rgba(224,122,95,0.12)] text-[#E07A5F]',  dot: 'bg-[#E07A5F]' },
  processing: { label: 'Confirmed', badge: 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]',  dot: 'bg-[#F59E0B]' },
  shipped:    { label: 'Shipped',   badge: 'bg-blue-900/30 text-blue-300',               dot: 'bg-blue-400' },
  delivered:  { label: 'Delivered', badge: 'bg-green-900/30 text-green-400',             dot: 'bg-green-400' },
  cancelled:  { label: 'Cancelled', badge: 'bg-red-900/30 text-red-400',                 dot: 'bg-red-500' },
}

const ICONS = {
  bag: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  ),
  heart: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ),
  pin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
}

// Reusable gold loading spinner
const Spinner = () => (
  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-yellow-500 mx-auto mt-16" />
)

// Section heading + gold gradient accent underline
const SectionHeading = ({ children }) => (
  <>
    <h1 className="text-2xl font-bold text-[#F59E0B]" style={FRAUNCES}>{children}</h1>
    <div className="w-24 h-px mt-1 mb-6 bg-gradient-to-r from-yellow-600 to-transparent" />
  </>
)

const OrderThumb = ({ src, alt }) => (
  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-raised border border-surface-border">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-silver-dim">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
        </svg>
      </div>
    )}
  </div>
)

const Profile = () => {
  const { user, updateUserInContext, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const setTab = (key) => setSearchParams({ tab: key })

  // ── Avatar photo (modal preview; persisted to localStorage) ─────────────────
  const fileInputRef = useRef(null)
  const [savedPhoto, setSavedPhoto] = useState(() => localStorage.getItem(`shivora_avatar_${user?.id}`) || null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedName, setSelectedName] = useState('')

  const openPhotoModal = () => { setPreviewUrl(savedPhoto); setSelectedName(''); setPhotoModalOpen(true) }
  const closePhotoModal = () => { setPhotoModalOpen(false); setPreviewUrl(null); setSelectedName('') }
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedName(file.name)
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(file)
  }
  const savePhoto = () => {
    if (!previewUrl) return
    localStorage.setItem(`shivora_avatar_${user?.id}`, previewUrl)
    setSavedPhoto(previewUrl)
    window.dispatchEvent(new Event('avatar_updated'))
    closePhotoModal()
  }
  const removePhoto = () => {
    localStorage.removeItem(`shivora_avatar_${user?.id}`)
    setSavedPhoto(null)
    window.dispatchEvent(new Event('avatar_updated'))
    closePhotoModal()
  }

  // ── Profile details form (logic unchanged) ─────────────────────────────────
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', address: user?.address || '',
    city: user?.city || '', state: user?.state || '', pincode: user?.pincode || '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '', phone: user.phone || '', address: user.address || '',
        city: user.city || '', state: user.state || '', pincode: user.pincode || '',
      })
    }
  }, [user])

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Overview stats ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ orders: null, wishlist: null, addresses: null })
  useEffect(() => {
    let active = true
    Promise.allSettled([getOrderHistory(), getWishlist(), getAddresses()]).then(([o, w, a]) => {
      if (!active) return
      // Reuse this same orders response for the "Recent Orders" overview list (no extra call)
      if (o.status === 'fulfilled') setOrderList(o.value.data.orders || [])
      setStats({
        orders: o.status === 'fulfilled' ? (o.value.data.orders?.length ?? 0) : null,
        wishlist: w.status === 'fulfilled' ? (w.value.data.wishlist?.length ?? 0) : null,
        addresses: a.status === 'fulfilled' ? (a.value.data.addresses?.length ?? 0) : null,
      })
    })
    return () => { active = false }
  }, [])

  // ── Inline section data (lazy-loaded when the tab is opened) ────────────────
  const [addrList, setAddrList] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [modalAddress, setModalAddress] = useState(undefined)   // undefined=closed | null=add | obj=edit
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [settingDefaultId, setSettingDefaultId] = useState(null)

  const [orderList, setOrderList] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [wishItems, setWishItems] = useState([])
  const [wishLoading, setWishLoading] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const loadAddresses = async () => {
    setAddrLoading(true)
    try { const res = await getAddresses(); setAddrList(res.data.addresses || []) }
    catch { toast.error('Could not load addresses') }
    finally { setAddrLoading(false) }
  }
  const loadOrders = async () => {
    setOrdersLoading(true)
    try { const res = await getOrderHistory(); setOrderList(res.data.orders || []) }
    catch { toast.error('Could not load orders') }
    finally { setOrdersLoading(false) }
  }
  const loadWishlist = async () => {
    setWishLoading(true)
    try { const res = await getWishlist(); setWishItems(res.data.wishlist || []) }
    catch { toast.error('Could not load wishlist') }
    finally { setWishLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'addresses') loadAddresses()
    else if (activeTab === 'orders') loadOrders()
    else if (activeTab === 'wishlist') loadWishlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id)
    try { await setDefaultAddress(id); toast.success('Default address updated'); loadAddresses() }
    catch { toast.error('Could not update default address') }
    finally { setSettingDefaultId(null) }
  }
  const handleDeleteAddress = async (id) => {
    setDeletingId(id)
    try { await deleteAddress(id); toast.success('Address deleted'); setConfirmDeleteId(null); loadAddresses() }
    catch (err) { toast.error(err.response?.data?.message || 'Could not delete address') }
    finally { setDeletingId(null) }
  }

  // ── Form handlers (unchanged) ───────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
    if (passwordErrors[name]) setPasswordErrors((prev) => ({ ...prev, [name]: undefined }))
  }
  const validateProfile = () => {
    const errors = {}
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) errors.phone = 'Enter a valid phone number'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  const validatePassword = () => {
    const errors = {}
    if (!passwordForm.current_password) errors.current_password = 'Current password is required'
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) errors.new_password = 'New password must be at least 6 characters'
    if (passwordForm.new_password !== passwordForm.confirm_password) errors.confirm_password = 'Passwords do not match'
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return
    setSavingProfile(true)
    try {
      const res = await updateProfile(form)
      updateUserInContext(res.data.user)
      setIsEditingProfile(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors)
      toast.error(err.response?.data?.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return
    setSavingPassword(true)
    try {
      await changePassword(passwordForm)
      toast.success('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      if (err.response?.data?.errors) setPasswordErrors(err.response.data.errors)
      toast.error(err.response?.data?.message || 'Could not change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = () => { setShowLogoutModal(true) }
  const confirmLogout = () => { logout(); navigate('/') }

  const initial = user?.name?.charAt(0).toUpperCase() || '?'
  const firstName = user?.name?.split(' ')[0] || 'there'
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null

  const statCards = [
    { icon: ICONS.bag, label: 'Total Orders', value: stats.orders, tab: 'orders' },
    { icon: ICONS.heart, label: 'Wishlist Items', value: stats.wishlist, tab: 'wishlist' },
    { icon: ICONS.pin, label: 'Saved Addresses', value: stats.addresses, tab: 'addresses' },
  ]

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0a0800' }}>

      {/* ── Desktop sidebar (sticky — fix preserved: self-start + max-h + top-16) */}
      <aside
        className="hidden lg:flex flex-col w-72 flex-shrink-0 self-start sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-r-2xl pt-6 px-4"
        style={{ background: 'linear-gradient(180deg, #1c1500 0%, #110e00 100%)', borderRight: '1px solid rgba(245,158,11,0.15)' }}
      >
        <div className="flex flex-col items-center text-center px-6 py-7">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#F59E0B] ring-2 ring-offset-2 ring-yellow-600/50 ring-offset-[#110e00] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            {savedPhoto ? (
              <img src={savedPhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-4xl" style={FRAUNCES}>{initial}</span>
            )}
          </div>
          <button
            type="button"
            onClick={openPhotoModal}
            className="mt-3 text-xs font-medium text-yellow-700 hover:text-yellow-500 transition-colors"
          >
            Change Photo
          </button>

          <p className="mt-2 text-lg font-semibold text-white/90 truncate max-w-full" style={FRAUNCES}>{user?.name}</p>
          <p className="text-sm text-yellow-600/60 truncate max-w-full">{user?.email}</p>

          <div className="w-full border-t border-yellow-900/40 mt-4" />
        </div>

        <nav className="flex-1 pb-2">
          {NAV.map((item) => {
            const active = item.key === activeTab
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full text-left flex items-center py-3 px-5 text-sm border-l-2 transition-all duration-200 ${
                  active
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500 font-semibold'
                    : 'border-transparent text-white/40 hover:text-yellow-300/80 hover:bg-yellow-500/5'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-yellow-900/40 py-2">
          <button onClick={handleLogout} className="w-full text-left flex items-center py-3 px-5 text-sm border-l-2 border-transparent text-red-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200">
            Logout
          </button>
        </div>
      </aside>

      {/* ── Right column ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Mobile horizontal tab strip (sticky below the navbar) */}
        <div className="lg:hidden sticky top-16 z-20 bg-base px-4 pt-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-surface-border">
            {NAV.map((item) => {
              const active = item.key === activeTab
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`whitespace-nowrap py-3 px-3 text-xs font-medium border-b-2 -mb-px transition-all duration-200 min-h-[44px] ${
                    active ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-white/40 hover:text-yellow-300/80'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area — warm gradient + faint gold vignette top */}
        <div
          className="relative p-5 sm:p-8 lg:p-10 max-w-[1100px]"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%), linear-gradient(135deg, #0d0b00 0%, #0a0800 50%, #0d0b00 100%)' }}
        >

          {/* ── MY ACCOUNT (overview) ───────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              {/* Mobile profile header — desktop shows this in sidebar */}
              <div className="lg:hidden flex flex-col items-center text-center mb-6 pb-6 border-b border-yellow-900/20">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#F59E0B] ring-2 ring-offset-2 ring-yellow-600/50 ring-offset-[#0a0800] shadow-[0_0_16px_rgba(245,158,11,0.25)]">
                  {savedPhoto ? (
                    <img src={savedPhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-3xl" style={FRAUNCES}>{initial}</span>
                  )}
                </div>
                <button onClick={openPhotoModal} className="mt-2 text-xs font-medium text-yellow-700 hover:text-yellow-500 transition-colors min-h-[44px] flex items-center">
                  Change Photo
                </button>
                <p className="text-base font-semibold text-white/90 truncate max-w-full" style={FRAUNCES}>{user?.name}</p>
                <p className="text-xs text-yellow-600/60 truncate max-w-full">{user?.email}</p>
              </div>
              <SectionHeading>My Account</SectionHeading>
              <p className="text-silver-muted -mt-4 mb-6">
                Welcome back, {firstName}!
                {memberSince && <span className="text-white/40"> · Member since {memberSince}</span>}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {statCards.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => setTab(card.tab)}
                    className="relative overflow-hidden min-h-[120px] p-3 sm:p-6 rounded-xl border border-[rgba(245,158,11,0.15)] hover:border-[rgba(245,158,11,0.4)] hover:scale-[1.02] transition-all text-left"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 100%)' }}
                  >
                    <div className="relative">
                      <div className="text-[#F59E0B] opacity-80">{card.icon}</div>
                      <p className="text-3xl md:text-4xl font-bold text-[#F59E0B] mt-2" style={FRAUNCES}>{card.value == null ? '—' : card.value}</p>
                      <p className="text-sm text-white/35 mt-1">{card.label}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link to="/products" className="btn !rounded-lg !py-3 !px-8 font-semibold justify-center text-black hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #FDE68A, #D97706)' }}>Continue Shopping</Link>
                <button onClick={() => setTab('orders')} className="btn !rounded-lg !py-3 !px-8 font-semibold border border-yellow-600/40 text-yellow-500/80 hover:border-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/5 transition-colors justify-center">View My Orders</button>
              </div>

              {/* Recent Orders — reuses the orders already fetched for stats */}
              {!ordersLoading && orderList.length > 0 && (
                <>
                  <div className="border-t border-yellow-900/20 mt-8 pt-6" />
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Recent Orders</p>
                  {orderList.slice(0, 2).map((order) => {
                    const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
                    const thumb = order.items?.[0]?.product_image && !order.items[0].product_image.startsWith('/uploads/') ? (order.items[0].product_image.startsWith('http') ? order.items[0].product_image : `${API_ORIGIN}${order.items[0].product_image}`) : null
                    return (
                      <div key={order.id} onClick={() => setTab('orders')} className="flex items-center gap-4 py-3.5 border-b border-yellow-900/20 cursor-pointer hover:bg-yellow-500/5 rounded-lg px-2">
                        {thumb
                          ? <img src={thumb} alt="" className="w-10 h-10 rounded object-cover bg-white/10" />
                          : <div className="w-10 h-10 rounded bg-white/10" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-sm text-white/80">₹{order.total_amount.toLocaleString('en-IN')}</span>
                        <svg className="w-4 h-4 text-yellow-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {/* ── PROFILE DETAILS (form logic unchanged) ──────────────────────── */}
          {activeTab === 'details' && (
            <div>
              <SectionHeading>Profile Details</SectionHeading>
              <form onSubmit={handleProfileSubmit} className="card p-6 space-y-4">
                <div>
                  <label className="label-text">Email Address</label>
                  <input value={user?.email || ''} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="label-text">Full Name</label>
                  <input name="name" value={form.name} onChange={handleProfileChange} disabled={!isEditingProfile} className={inputCls} />
                  {formErrors.name && <p className="error-text">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="label-text">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleProfileChange} disabled={!isEditingProfile} className={inputCls} placeholder="+91 98765 43210" />
                  {formErrors.phone && <p className="error-text">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="label-text">Address</label>
                  <textarea name="address" value={form.address} onChange={handleProfileChange} rows={2} disabled={!isEditingProfile} className={inputCls} />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label-text">City</label>
                    <input name="city" value={form.city} onChange={handleProfileChange} disabled={!isEditingProfile} className={inputCls} />
                  </div>
                  <div>
                    <label className="label-text">State</label>
                    <input name="state" value={form.state} onChange={handleProfileChange} disabled={!isEditingProfile} className={inputCls} />
                  </div>
                  <div>
                    <label className="label-text">Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleProfileChange} disabled={!isEditingProfile} className={inputCls} />
                  </div>
                </div>
                <div className="flex sm:justify-end">
                  {!isEditingProfile ? (
                    <button type="button" onClick={() => setIsEditingProfile(true)} className="btn-primary !rounded-lg !py-3 !px-8 w-full sm:w-auto">
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="btn !rounded-lg !py-3 !px-6 flex-1 sm:flex-none border border-surface-border text-silver-dim">
                        Cancel
                      </button>
                      <button type="submit" disabled={savingProfile} className="btn-primary !rounded-lg !py-3 !px-8 flex-1 sm:flex-none">
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ── CHANGE PASSWORD (form logic unchanged) ──────────────────────── */}
          {activeTab === 'password' && (
            <div>
              <SectionHeading>Change Password</SectionHeading>
              <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-4">
                <div>
                  <label className="label-text">Current Password</label>
                  <input type="password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChange} className={inputCls} />
                  {passwordErrors.current_password && <p className="error-text">{passwordErrors.current_password}</p>}
                </div>
                <div>
                  <label className="label-text">New Password</label>
                  <input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} className={inputCls} />
                  {passwordErrors.new_password && <p className="error-text">{passwordErrors.new_password}</p>}
                </div>
                <div>
                  <label className="label-text">Confirm New Password</label>
                  <input type="password" name="confirm_password" value={passwordForm.confirm_password} onChange={handlePasswordChange} className={inputCls} />
                  {passwordErrors.confirm_password && <p className="error-text">{passwordErrors.confirm_password}</p>}
                </div>
                <div className="flex sm:justify-end">
                  <button type="submit" disabled={savingPassword} className="btn-primary !rounded-lg !py-3 !px-8 w-full sm:w-auto">
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── MY ADDRESSES (inline) ───────────────────────────────────────── */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div><SectionHeading>My Addresses</SectionHeading></div>
                {!addrLoading && addrList.length > 0 && (
                  <button onClick={() => setModalAddress(null)} className="btn !rounded-lg !px-5 w-full sm:w-auto mb-4 border border-yellow-600/40 text-yellow-500/80 hover:border-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/5 transition-colors">
                    + Add New Address
                  </button>
                )}
              </div>

              {addrLoading ? (
                <Spinner />
              ) : addrList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-parchment mb-1">No saved addresses yet</h2>
                  <p className="text-silver-muted mb-5">Add an address to speed up checkout.</p>
                  <button onClick={() => setModalAddress(null)} className="btn-primary !rounded-lg !px-6 w-full">+ Add New Address</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addrList.map((addr) => (
                    <div key={addr.id} className="card p-4 flex flex-col gap-3 !border-[rgba(245,158,11,0.15)]" style={{ background: 'rgba(245,158,11,0.04)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-parchment">{addr.full_name} <span className="text-silver-dim font-normal">• {addr.phone}</span></p>
                        {addr.is_default && (
                          <span className="flex-shrink-0 inline-flex items-center bg-yellow-600 text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest">Default</span>
                        )}
                      </div>
                      <div className="text-sm text-silver-muted space-y-0.5">
                        <p>{addr.address_line1}</p>
                        {addr.address_line2 && <p>{addr.address_line2}</p>}
                        <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>

                      {confirmDeleteId === addr.id ? (
                        <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
                          <span className="text-xs text-silver-muted flex-1">Remove this address?</span>
                          <button onClick={() => handleDeleteAddress(addr.id)} disabled={deletingId === addr.id} className="text-xs font-semibold text-red-400 hover:underline disabled:opacity-50">
                            {deletingId === addr.id ? 'Deleting…' : 'Yes, Delete'}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold text-silver-muted hover:text-parchment hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 pt-2 border-t border-surface-border text-xs font-semibold">
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.id)} disabled={settingDefaultId === addr.id} className="text-[#F59E0B] hover:underline disabled:opacity-50">
                              {settingDefaultId === addr.id ? 'Updating…' : 'Set as Default'}
                            </button>
                          )}
                          <button onClick={() => { setConfirmDeleteId(null); setModalAddress(addr) }} className="text-silver-muted hover:text-parchment hover:underline">Edit</button>
                          <button onClick={() => setConfirmDeleteId(addr.id)} className="text-red-400 hover:underline ml-auto">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {modalAddress !== undefined && (
                <AddressFormModal
                  address={modalAddress}
                  onClose={() => setModalAddress(undefined)}
                  onSaved={() => { setModalAddress(undefined); loadAddresses() }}
                />
              )}
            </div>
          )}

          {/* ── MY ORDERS (inline) ──────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div>
              <SectionHeading>My Orders</SectionHeading>

              {ordersLoading ? (
                <Spinner />
              ) : orderList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-parchment mb-1">No orders yet</h2>
                  <p className="text-silver-muted mb-5">When you place an order, it will show up here.</p>
                  <Link to="/products" className="btn-primary !rounded-lg !px-6">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {orderList.map((order) => {
                    const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
                    return (
                      <div key={order.id} className="card overflow-hidden !border-[rgba(245,158,11,0.12)]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-surface-border">
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <p className="text-sm font-semibold text-parchment mt-0.5">
                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</p>
                            {order.discount_amount > 0 && (
                              <p className="text-[11px] font-semibold text-[#F59E0B] mt-0.5">Saved ₹{order.discount_amount.toLocaleString('en-IN')}{order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ''}</p>
                            )}
                          </div>
                        </div>

                        {/* Tracking timeline */}
                        <div className="px-5 py-5 border-b border-surface-border">
                          <OrderTimeline status={order.status} />
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-surface-border">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                              <OrderThumb src={!item.product_image || item.product_image.startsWith('/uploads/') ? null : item.product_image.startsWith('http') ? item.product_image : `${API_ORIGIN}${item.product_image}`} alt={item.product_name} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-parchment truncate">{item.product_name}</p>
                                <p className="text-xs text-silver-dim mt-0.5">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold text-parchment flex-shrink-0">₹{item.subtotal.toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MY WISHLIST (inline) ────────────────────────────────────────── */}
          {activeTab === 'wishlist' && (
            <div>
              <SectionHeading>My Wishlist</SectionHeading>

              {wishLoading ? (
                <Spinner />
              ) : wishItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-raised flex items-center justify-center">
                    <svg className="w-8 h-8 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-parchment mb-1">Your wishlist is empty</h2>
                  <p className="text-silver-muted mb-5">Save items you love for later.</p>
                  <Link to="/products" className="btn-primary !rounded-lg !px-6">Browse Products</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {wishItems.map((item) => item.product ? (
                    <ProductCard key={item.id} product={item.product} />
                  ) : null)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Update Profile Photo modal ──────────────────────────────────────── */}
      {photoModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closePhotoModal}>
          <div className="bg-[#1a1507] border border-yellow-900/40 rounded-2xl p-6 w-80 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-[#F59E0B]" style={FRAUNCES}>Update Profile Photo</h3>
              <button type="button" onClick={closePhotoModal} aria-label="Close" className="text-white/40 hover:text-white/70 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-2 border-yellow-500/40 flex items-center justify-center bg-[#F59E0B]">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-4xl" style={FRAUNCES}>{initial}</span>
              )}
            </div>

            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn w-full !py-2 !rounded-lg text-sm border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors">
              Choose Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {selectedName && <p className="text-xs text-white/40 mt-2 text-center truncate">{selectedName}</p>}

            <button type="button" onClick={savePhoto} disabled={!selectedName} className="btn-primary w-full !py-2 !rounded-lg text-sm font-semibold mt-3 disabled:opacity-50 disabled:cursor-not-allowed">
              Save Photo
            </button>

            <div className="flex items-center justify-between mt-3">
              {savedPhoto ? (
                <button type="button" onClick={removePhoto} className="text-red-400/60 text-xs hover:text-red-400 transition-colors">Remove Photo</button>
              ) : <span />}
              <button type="button" onClick={closePhotoModal} className="text-white/40 text-xs hover:text-white/60 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default Profile
