import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { checkout, buyNowCheckout } from '../api/orderApi'
import { getAddresses, createAddress } from '../api/addressApi'
import { validateCoupon } from '../api/couponApi'
import Loader from '../components/common/Loader'

const Checkout = () => {
  const { cartItems, cartTotal, loading, clearCartItems } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // buyNow is set when the user clicked "Buy Now" on a product page.
  // It carries { productId, quantity, name, price } via router state.
  // The cart is never read or modified in this flow.
  const buyNow = location.state?.buyNow ?? null

  // ── Saved-address picker state ──────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses]     = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [mode, setMode]                         = useState('form')   // 'picker' | 'form'
  const [saveToBook, setSaveToBook]             = useState(true)
  const [addrLoading, setAddrLoading]           = useState(true)

  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_address2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // ── Coupon state ────────────────────────────────────────────────────────────
  const [couponOpen, setCouponOpen]       = useState(false)
  const [couponInput, setCouponInput]     = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)   // { code, discount_percent, discount_amount }
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Prefill the manual form from the user profile (used when no saved addresses)
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        shipping_name: user.name || '',
        shipping_phone: user.phone || '',
        shipping_address: user.address || '',
        shipping_city: user.city || '',
        shipping_state: user.state || '',
        shipping_pincode: user.pincode || '',
      }))
    }
  }, [user])

  // Fetch saved addresses on mount → pick mode + pre-select default
  useEffect(() => {
    let active = true
    getAddresses()
      .then((res) => {
        if (!active) return
        const list = res.data.addresses || []
        setSavedAddresses(list)
        if (list.length > 0) {
          const def = list.find((a) => a.is_default) || list[0]
          setSelectedAddressId(def.id)
          setMode('picker')
        } else {
          setMode('form')
        }
      })
      .catch(() => { if (active) setMode('form') })
      .finally(() => { if (active) setAddrLoading(false) })
    return () => { active = false }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleAddNew = () => {
    setForm({
      shipping_name: '', shipping_phone: '', shipping_address: '', shipping_address2: '',
      shipping_city: '', shipping_state: '', shipping_pincode: '',
    })
    setErrors({})
    setSaveToBook(true)
    setMode('form')
  }

  const handleBackToPicker = () => {
    setErrors({})
    setMode('picker')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.shipping_name.trim()) newErrors.shipping_name = 'Full name is required'
    if (!form.shipping_phone.trim()) newErrors.shipping_phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.shipping_phone.trim())) newErrors.shipping_phone = 'Enter a valid 10-digit phone number'
    if (!form.shipping_address.trim()) newErrors.shipping_address = 'Address line 1 is required'
    if (!form.shipping_city.trim()) newErrors.shipping_city = 'City is required'
    if (!form.shipping_state.trim()) newErrors.shipping_state = 'State is required'
    if (!form.shipping_pincode.trim()) newErrors.shipping_pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(form.shipping_pincode.trim())) newErrors.shipping_pincode = 'Enter a valid 6-digit pincode'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Build the shipping payload the order API expects, from picker OR form.
  // Order API keys: shipping_name, shipping_phone, shipping_address,
  //                 shipping_city, shipping_state, shipping_pincode
  const buildShippingPayload = () => {
    if (mode === 'picker') {
      const a = savedAddresses.find((x) => x.id === selectedAddressId)
      return {
        shipping_name: a.full_name,
        shipping_phone: a.phone,
        shipping_address: a.address_line2 ? `${a.address_line1}, ${a.address_line2}` : a.address_line1,
        shipping_city: a.city,
        shipping_state: a.state,
        shipping_pincode: a.pincode,
      }
    }
    const line2 = form.shipping_address2.trim()
    return {
      shipping_name: form.shipping_name.trim(),
      shipping_phone: form.shipping_phone.trim(),
      shipping_address: line2 ? `${form.shipping_address.trim()}, ${line2}` : form.shipping_address.trim(),
      shipping_city: form.shipping_city.trim(),
      shipping_state: form.shipping_state.trim(),
      shipping_pincode: form.shipping_pincode.trim(),
    }
  }

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) { setCouponError('Enter a coupon code'); return }
    const total = buyNow ? buyNow.price * buyNow.quantity : cartTotal
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await validateCoupon(code, total)
      if (res.data.valid) {
        setAppliedCoupon({
          code: res.data.code,
          discount_percent: res.data.discount_percent,
          discount_amount: res.data.discount_amount,
        })
        setCouponError('')
      } else {
        setAppliedCoupon(null)
        setCouponError(res.data.error || 'Invalid coupon code')
      }
    } catch (err) {
      setAppliedCoupon(null)
      setCouponError(err.response?.data?.error || err.response?.data?.message || 'Could not validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'picker') {
      if (!selectedAddressId) { toast.error('Please select a delivery address'); return }
    } else if (!validate()) {
      return
    }

    const shipping = buildShippingPayload()
    if (appliedCoupon) shipping.coupon_code = appliedCoupon.code
    setSubmitting(true)
    try {
      // Form mode: optionally save the new address to the book.
      // Best-effort — a save failure must NEVER block the order.
      if (mode === 'form' && saveToBook) {
        try {
          await createAddress({
            full_name: form.shipping_name.trim(),
            phone: form.shipping_phone.trim(),
            address_line1: form.shipping_address.trim(),
            address_line2: form.shipping_address2.trim() || undefined,
            city: form.shipping_city.trim(),
            state: form.shipping_state.trim(),
            pincode: form.shipping_pincode.trim(),
          })
        } catch {
          // swallow — order still proceeds
        }
      }

      let res
      if (buyNow) {
        // Single-product instant checkout — cart untouched
        res = await buyNowCheckout(buyNow.productId, buyNow.quantity, shipping)
      } else {
        res = await checkout(shipping)
        await clearCartItems()
      }
      toast.success('Order placed successfully!')
      navigate(`/order-confirmation/${res.data.order.id}`)
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      toast.error(err.response?.data?.message || 'Could not place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Wait for the address fetch (and, in cart mode, the cart) before rendering.
  if (addrLoading || (!buyNow && loading)) return <Loader fullScreen label="Loading checkout..." />

  // Show empty-cart screen only when doing a normal cart checkout with nothing in the cart.
  if (!buyNow && cartItems.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-xl font-bold text-parchment mb-2">Your cart is empty</h2>
        <p className="text-silver-muted mb-6">Add some products before checking out.</p>
        <Link to="/products" className="btn-primary !px-6">Browse Products</Link>
      </div>
    )
  }

  // Totals — computed from buyNow item or the full cart
  const orderTotal = buyNow ? buyNow.price * buyNow.quantity : cartTotal
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0
  const discountedSubtotal = Math.max(0, orderTotal - discount)
  const shippingFee = orderTotal >= 999 ? 0 : 49
  const finalTotal = discountedSubtotal + shippingFee

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-parchment">Checkout</h1>
        {buyNow && (
          <span className="inline-flex items-center gap-1 bg-gold/15 text-gold border border-gold/30 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Buy Now
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 relative">
        <form id="checkout-form" onSubmit={handleSubmit} className="card p-6 space-y-4">

          {/* ── DELIVERY ADDRESS — picker OR manual form ───────────────────── */}
          {mode === 'picker' ? (
            <>
              <h3 className="font-bold text-gold mb-2">Deliver to</h3>

              <div className="space-y-3">
                {savedAddresses.map((a) => {
                  const selected = a.id === selectedAddressId
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setSelectedAddressId(a.id)}
                      className={`w-full text-left rounded-lg border p-4 transition-colors ${
                        selected
                          ? 'border-gold bg-gold/10'
                          : 'border-surface-border bg-surface hover:border-gold/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* radio dot */}
                        <span className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          selected ? 'border-gold' : 'border-silver-dim'
                        }`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-gold" />}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-parchment">
                              {a.full_name} <span className="text-silver-dim font-normal">• {a.phone}</span>
                            </p>
                            {a.is_default && (
                              <span className="flex-shrink-0 inline-flex items-center bg-gold text-[#14130F] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-silver-muted mt-1 space-y-0.5">
                            <p>{a.address_line1}</p>
                            {a.address_line2 && <p>{a.address_line2}</p>}
                            <p>{a.city}, {a.state} — {a.pincode}</p>
                          </div>
                        </div>

                        {selected && (
                          <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleAddNew}
                className="btn border border-gold text-gold hover:bg-gold/10 transition-colors !px-5"
              >
                + Add New Address
              </button>
            </>
          ) : (
            <>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackToPicker}
                  className="text-sm font-semibold text-gold hover:underline"
                >
                  ← Back to saved addresses
                </button>
              )}

              <h3 className="font-bold text-parchment mb-2">
                {savedAddresses.length > 0 ? 'Add New Address' : 'Shipping Information'}
              </h3>

              <div>
                <label className="label-text">Full Name*</label>
                <input name="shipping_name" value={form.shipping_name} onChange={handleChange} className="input-field" placeholder="John Doe" />
                {errors.shipping_name && <p className="error-text">{errors.shipping_name}</p>}
              </div>

              <div>
                <label className="label-text">Phone Number*</label>
                <input name="shipping_phone" value={form.shipping_phone} onChange={handleChange} className="input-field" placeholder="10-digit mobile number" maxLength={10} />
                {errors.shipping_phone && <p className="error-text">{errors.shipping_phone}</p>}
              </div>

              <div>
                <label className="label-text">Address Line 1*</label>
                <input name="shipping_address" value={form.shipping_address} onChange={handleChange} className="input-field" placeholder="House no., street, locality" />
                {errors.shipping_address && <p className="error-text">{errors.shipping_address}</p>}
              </div>

              <div>
                <label className="label-text">Address Line 2 <span className="text-silver-dim font-normal">(optional)</span></label>
                <input name="shipping_address2" value={form.shipping_address2} onChange={handleChange} className="input-field" placeholder="Apartment, landmark, etc." />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-text">City*</label>
                  <input name="shipping_city" value={form.shipping_city} onChange={handleChange} className="input-field" placeholder="Bengaluru" />
                  {errors.shipping_city && <p className="error-text">{errors.shipping_city}</p>}
                </div>
                <div>
                  <label className="label-text">State*</label>
                  <input name="shipping_state" value={form.shipping_state} onChange={handleChange} className="input-field" placeholder="Karnataka" />
                  {errors.shipping_state && <p className="error-text">{errors.shipping_state}</p>}
                </div>
                <div>
                  <label className="label-text">Pincode*</label>
                  <input name="shipping_pincode" value={form.shipping_pincode} onChange={handleChange} className="input-field" placeholder="560001" maxLength={6} />
                  {errors.shipping_pincode && <p className="error-text">{errors.shipping_pincode}</p>}
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToBook}
                  onChange={(e) => setSaveToBook(e.target.checked)}
                  style={{ accentColor: '#C9A24B' }}
                />
                <span className="text-sm text-silver-muted">Save this address to my address book</span>
              </label>
            </>
          )}

          {/* ── Coupon ─────────────────────────────────────────────────────── */}
          <div className="pt-2 border-t border-surface-border">
            {!appliedCoupon && !couponOpen && (
              <button
                type="button"
                onClick={() => setCouponOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-gold hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z" />
                </svg>
                Have a coupon?
              </button>
            )}

            {couponOpen && !appliedCoupon && (
              <div>
                <label className="label-text">Coupon code</label>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponError) setCouponError('') }}
                    placeholder="ENTER CODE"
                    className="input-field uppercase"
                  />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading} className="btn-primary !px-5 whitespace-nowrap">
                    {couponLoading ? 'Applying…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="error-text">{couponError}</p>}
              </div>
            )}

            {appliedCoupon && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-green-700/40 bg-green-900/15 px-3 py-2.5">
                <p className="text-sm text-green-400">
                  <span className="font-bold">{appliedCoupon.code}</span> applied! You save{' '}
                  ₹{appliedCoupon.discount_amount.toLocaleString('en-IN')} ({appliedCoupon.discount_percent}% off)
                </p>
                <button type="button" onClick={handleRemoveCoupon} className="text-xs font-semibold text-silver-muted hover:text-red-400 hover:underline flex-shrink-0">
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* ── Payment method (UNCHANGED) ─────────────────────────────────── */}
          <div className="pt-2">
            <p className="label-text mb-2">Payment Method</p>
            <div className="flex items-center gap-2 border border-surface-border rounded-lg px-4 py-3 bg-surface-raised">
              <input type="radio" checked readOnly style={{ accentColor: '#C9A24B' }} />
              <span className="text-sm font-medium text-silver-muted">Cash on Delivery (COD)</span>
            </div>
          </div>

          {/* ── Submit (UNCHANGED) ─────────────────────────────────────────── */}
          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 mt-2">
            {submitting ? 'Placing Order...' : `Place Order — ₹${finalTotal.toLocaleString('en-IN')}`}
          </button>
        </form>

        {/* ── Order Summary (UNCHANGED) ────────────────────────────────────── */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="font-bold text-parchment mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {buyNow ? (
              <div className="flex justify-between text-sm">
                <span className="text-silver-muted truncate pr-2">{buyNow.name} × {buyNow.quantity}</span>
                <span className="font-medium text-parchment flex-shrink-0">
                  ₹{(buyNow.price * buyNow.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-silver-muted truncate pr-2">{item.product?.name} × {item.quantity}</span>
                  <span className="font-medium text-parchment flex-shrink-0">₹{item.subtotal?.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
          <div className="space-y-2 text-sm border-t border-surface-border pt-3 mb-3">
            <div className="flex justify-between text-silver-muted">
              <span>Subtotal</span>
              <span>₹{orderTotal.toLocaleString('en-IN')}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-gold font-medium">
                <span>Discount ({appliedCoupon.code})</span>
                <span>−₹{appliedCoupon.discount_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-silver-muted">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-parchment text-base border-t border-surface-border pt-3">
            <span>Total</span>
            <span>₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface-border p-4 shadow-2xl">
        <button type="submit" form="checkout-form" className="btn-primary w-full !py-3 text-base font-semibold">
          Place Order
        </button>
      </div>
    </div>
  )
}

export default Checkout
