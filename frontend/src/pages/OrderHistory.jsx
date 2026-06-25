import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrderHistory, cancelOrder } from '../api/orderApi'
import { API_ORIGIN } from '../api/axiosInstance'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'
import OrderTimeline from '../components/order/OrderTimeline'
import ReturnRequestModal from '../components/ReturnRequestModal'

const RETURN_BADGE = {
  Requested: 'bg-amber-900/30 text-amber-300',
  Approved:  'bg-green-900/30 text-green-400',
  Rejected:  'bg-red-900/30 text-red-400',
}

const STATUS_CONFIG = {
  pending:    { label: 'Pending',   dot: 'bg-silver-dim',  badge: 'bg-surface-raised text-silver-muted' },
  processing: { label: 'Confirmed', dot: 'bg-amber-400',   badge: 'bg-amber-900/30 text-amber-300' },
  shipped:    { label: 'Shipped',   dot: 'bg-blue-400',    badge: 'bg-blue-900/30 text-blue-300' },
  delivered:  { label: 'Delivered', dot: 'bg-gold',        badge: 'bg-gold/10 text-gold' },
  cancelled:  { label: 'Cancelled', dot: 'bg-red-500',     badge: 'bg-red-900/30 text-red-400' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const Thumbnail = ({ src, alt }) => (
  <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-raised border border-surface-border">
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover"
        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg' }} />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-silver-dim">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
    )}
  </div>
)

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [returnOrder, setReturnOrder] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getOrderHistory()
      setOrders(res.data.orders)
    } catch {
      setError('Could not load your orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancellingId(orderId)
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled')
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <Loader fullScreen label="Loading your orders..." />

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-parchment mb-6">My Orders</h1>

      {error && <ErrorAlert message={error} onRetry={loadOrders} />}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-parchment mb-2">No orders yet</h2>
          <p className="text-silver-muted mb-6">When you place an order, it will show up here.</p>
          <Link to="/products" className="btn-primary !px-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order, index) => (
            <div key={order.id} className="card overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-surface-border">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide">Order #{orders.length - index}</p>
                    <p className="text-sm font-semibold text-parchment mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</p>
                  {order.discount_amount > 0 && (
                    <p className="text-[11px] font-semibold text-gold mt-0.5">
                      Saved ₹{order.discount_amount.toLocaleString('en-IN')}{order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Order tracking timeline */}
              <div className="px-5 py-5 border-b border-surface-border">
                <OrderTimeline status={order.status} />
              </div>

              {/* Items */}
              <div className="divide-y divide-surface-border">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 flex-wrap sm:flex-nowrap">
                    <Link to={item.product_id ? `/products/${item.product_id}` : '#'} className="flex-shrink-0">
                      <Thumbnail
                        src={!item.product_image || item.product_image.startsWith('/uploads/') ? '/placeholder-product.svg' : item.product_image.startsWith('http') ? item.product_image : `${API_ORIGIN}${item.product_image}`}
                        alt={item.product_name}
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={item.product_id ? `/products/${item.product_id}` : '#'}
                        className="text-sm font-medium text-parchment hover:text-gold truncate block transition-colors"
                      >
                        {item.product_name}
                      </Link>
                      <p className="text-xs text-silver-dim mt-0.5">Qty: {item.quantity}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-parchment">₹{item.subtotal.toLocaleString('en-IN')}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-silver-dim mt-0.5">₹{item.price.toLocaleString('en-IN')} each</p>
                      )}
                    </div>

                    {order.status === 'delivered' && item.product_id && (
                      <Link
                        to={`/products/${item.product_id}`}
                        className="flex-shrink-0 ml-1 text-xs font-semibold text-gold border border-gold/50 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors whitespace-nowrap"
                      >
                        Rate &amp; Review
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-surface-raised px-5 py-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Ship to</p>
                    <p className="text-sm font-medium text-silver-muted">{order.shipping_name}</p>
                    <p className="text-xs text-silver-dim mt-0.5">{order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Payment</p>
                    <p className="text-sm font-medium text-silver-muted">{order.payment_method}</p>
                  </div>
                </div>

                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={cancellingId === order.id}
                    className="btn-danger !py-1.5 !px-4 text-sm"
                  >
                    {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                )}

                {order.status === 'delivered' && (
                  order.return_request ? (
                    <div className="text-right">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${RETURN_BADGE[order.return_request.status] ?? RETURN_BADGE.Requested}`}>
                        Return {order.return_request.status}
                      </span>
                      {order.return_request.status === 'Rejected' && order.return_request.admin_note && (
                        <p className="text-[11px] text-red-400/70 mt-1 max-w-[240px]">{order.return_request.admin_note}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setReturnOrder(order)}
                      className="btn !py-1.5 !px-4 text-sm border border-gold text-gold hover:bg-gold/10 transition-colors"
                    >
                      Request Return
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {returnOrder && (
        <ReturnRequestModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSubmitted={() => { setReturnOrder(null); loadOrders() }}
        />
      )}
    </div>
  )
}

export default OrderHistory
