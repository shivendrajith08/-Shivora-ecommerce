import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail } from '../api/orderApi'
import { API_ORIGIN } from '../api/axiosInstance'
import Loader from '../components/common/Loader'

const Thumbnail = ({ src, alt }) => (
  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-surface-raised border border-surface-border">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-silver-dim">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
        </svg>
      </div>
    )}
  </div>
)

const SuccessCheck = () => (
  <>
    <style>{`
      @keyframes oc-pop  { 0% { transform: scale(0); } 60% { transform: scale(1.12); } 100% { transform: scale(1); } }
      @keyframes oc-draw { to { stroke-dashoffset: 0; } }
    `}</style>
    <div
      className="w-20 h-20 rounded-full border-4 border-gold flex items-center justify-center bg-gold/5"
      style={{ animation: 'oc-pop 0.45s cubic-bezier(0.22,1,0.36,1)' }}
    >
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#4CAF50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 12.75l6 6 9-13.5" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'oc-draw 0.4s ease-out 0.3s forwards' }} />
      </svg>
    </div>
  </>
)

const OrderConfirmation = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    getOrderDetail(orderId)
      .then((res) => { if (active) setOrder(res.data.order) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orderId])

  if (loading) return <Loader fullScreen label="Loading your order..." />

  // Friendly error state — no crash
  if (error || !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-surface-raised flex items-center justify-center">
          <svg className="w-8 h-8 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-parchment mb-2">Order not found</h2>
        <p className="text-silver-muted mb-6">We couldn't find that order. It may not exist or belong to your account.</p>
        <Link to="/orders" className="btn-primary !px-6">Go to My Orders</Link>
      </div>
    )
  }

  const total = order.total_amount
  const discount = order.discount_amount || 0
  const subtotal = total + discount   // total_amount is already post-discount

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Success header */}
      <div className="flex flex-col items-center text-center mb-8">
        <SuccessCheck />
        <h1 className="text-3xl font-bold text-gold mt-5 mb-2">Order Confirmed!</h1>
        <p className="text-silver-muted">Thank you for your order. Your order has been placed successfully.</p>
        <p className="text-sm text-silver-dim mt-1">Estimated delivery: 5–7 business days</p>
        {order.return_request && (
          <span className={`mt-3 inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
            order.return_request.status === 'Approved' ? 'bg-green-900/30 text-green-400'
              : order.return_request.status === 'Rejected' ? 'bg-red-900/30 text-red-400'
              : 'bg-amber-900/30 text-amber-300'
          }`}>
            Return {order.return_request.status}
          </span>
        )}
      </div>

      <div className="card p-6 space-y-6">
        {/* Items */}
        <div>
          <h3 className="font-bold text-parchment mb-3">Items</h3>
          <div className="divide-y divide-surface-border">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Thumbnail src={!item.product_image || item.product_image.startsWith('/uploads/') ? null : item.product_image.startsWith('http') ? item.product_image : `${API_ORIGIN}${item.product_image}`} alt={item.product_name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-parchment truncate">{item.product_name}</p>
                  <p className="text-xs text-silver-dim mt-0.5">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-sm font-semibold text-parchment flex-shrink-0">₹{item.subtotal.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-border" />

        {/* Delivery address + payment */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide mb-2">Delivery Address</p>
            <p className="text-sm font-medium text-parchment">{order.shipping_name}</p>
            <p className="text-sm text-silver-muted">{order.shipping_phone}</p>
            <p className="text-sm text-silver-muted mt-1">{order.shipping_address}</p>
            <p className="text-sm text-silver-muted">{order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide mb-2">Payment</p>
            <p className="text-sm font-medium text-silver-muted">Cash on Delivery</p>
          </div>
        </div>

        <div className="border-t border-surface-border" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-silver-muted">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gold font-medium">
              <span>Discount{order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ''}</span>
              <span>−₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-silver-muted">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between font-bold text-parchment text-base border-t border-surface-border pt-2 mt-1">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link to="/orders" className="btn-primary flex-1 !py-3 justify-center">Track Order</Link>
        <Link to="/products" className="btn-secondary flex-1 !py-3 justify-center">Continue Shopping</Link>
      </div>
    </div>
  )
}

export default OrderConfirmation
