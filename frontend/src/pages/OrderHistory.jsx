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
  pending:    { label: 'Pending',   dot: 'bg-[#E07A5F]',  badge: 'bg-[rgba(224,122,95,0.12)] text-[#E07A5F]' },
  processing: { label: 'Confirmed', dot: 'bg-[#F59E0B]',  badge: 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' },
  shipped:    { label: 'Shipped',   dot: 'bg-blue-400',   badge: 'bg-blue-900/30 text-blue-300' },
  delivered:  { label: 'Delivered', dot: 'bg-green-400',  badge: 'bg-green-900/30 text-green-400' },
  cancelled:  { label: 'Cancelled', dot: 'bg-red-500',    badge: 'bg-red-900/30 text-red-400' },
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

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [returnOrder, setReturnOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const toggleOrder = (id) => setExpandedOrder((prev) => (prev === id ? null : id))

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
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-parchment mb-2">No orders yet</h2>
          <p className="text-silver-muted mb-6">When you place an order, it will show up here.</p>
          <Link to="/products" className="btn-primary !px-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const isExpanded = expandedOrder === order.id
            const canCancel = order.status === 'pending' || order.status === 'processing'

            return (
              <div key={order.id} className="card overflow-hidden">
                {/* Clickable header */}
                <div
                  className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide">Order #{orders.length - index}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-silver-dim">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</p>
                      {order.discount_amount > 0 && (
                        <p className="text-[11px] font-semibold text-[#F59E0B] mt-0.5">
                          Saved ₹{order.discount_amount.toLocaleString('en-IN')}{order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ''}
                        </p>
                      )}
                    </div>
                    {/* Chevron */}
                    <svg
                      className={`w-5 h-5 text-silver-dim transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <>
                    {/* Order tracking timeline */}
                    <div className="px-3 py-3 sm:px-5 sm:py-4 border-t border-surface-border">
                      <OrderTimeline status={order.status} />
                    </div>

                    {/* Items — rendered for ALL statuses including cancelled */}
                    <div className="divide-y divide-surface-border border-t border-surface-border">
                      {order.items?.map((item) => {
                        const imgSrc = !item.product_image || item.product_image.startsWith('/uploads/')
                          ? '/placeholder-product.svg'
                          : item.product_image.startsWith('http')
                            ? item.product_image
                            : `${API_ORIGIN}${item.product_image}`

                        return (
                          <div key={item.id} className="flex items-center gap-3 px-3 py-3 sm:px-5">
                            <Link to={item.product_id ? `/products/${item.product_id}` : '#'} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-raised border border-surface-border flex-shrink-0">
                                <img
                                  src={imgSrc}
                                  alt={item.product_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg' }}
                                />
                              </div>
                            </Link>

                            <div className="flex-1 min-w-0">
                              <Link
                                to={item.product_id ? `/products/${item.product_id}` : '#'}
                                className="text-sm font-medium text-parchment hover:text-[#F59E0B] truncate block transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.product_name}
                              </Link>
                              <p className="text-xs text-silver-dim mt-0.5">Qty: {item.quantity}</p>
                            </div>

                            <div className="flex-shrink-0 text-right">
                              <p className="text-sm font-semibold text-[#FCD34D]">₹{item.subtotal.toLocaleString('en-IN')}</p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] text-silver-dim mt-0.5">₹{item.price.toLocaleString('en-IN')} each</p>
                              )}
                            </div>

                            {order.status === 'delivered' && item.product_id && (
                              <Link
                                to={`/products/${item.product_id}`}
                                className="flex-shrink-0 ml-1 text-xs font-semibold text-[#F59E0B] border border-[#F59E0B]/50 rounded-lg px-3 py-1.5 hover:bg-[#F59E0B]/10 transition-colors whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Rate &amp; Review
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Order meta */}
                    <div className="bg-surface-raised px-3 py-3 sm:px-5 sm:py-4 border-t border-surface-border">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:gap-8 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-0.5">Order ID</p>
                          <p className="text-xs font-medium text-silver-muted font-mono">#{order.id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-0.5">Payment</p>
                          <p className="text-xs font-medium text-silver-muted">{order.payment_method || 'Cash on Delivery'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-0.5">Ship to</p>
                          <p className="text-xs font-medium text-silver-muted">{order.shipping_name}</p>
                          <p className="text-[11px] text-silver-dim">{order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-0.5">Total</p>
                          <p className="text-sm font-bold text-[#FCD34D]">₹{order.total_amount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {canCancel && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCancelTarget(order.id) }}
                            disabled={cancellingId === order.id}
                            className="text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === order.id ? 'Cancelling…' : 'Cancel Order'}
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          order.return_request ? (
                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${RETURN_BADGE[order.return_request.status] ?? RETURN_BADGE.Requested}`}>
                              Return {order.return_request.status}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReturnOrder(order) }}
                              className="text-sm px-4 py-2 rounded-lg border border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                            >
                              Request Return
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {returnOrder && (
        <ReturnRequestModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSubmitted={() => { setReturnOrder(null); loadOrders() }}
        />
      )}

      {cancelTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="bg-[#060D22] border border-[rgba(245,158,11,0.2)] rounded-xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[#F59E0B] font-semibold text-lg mb-2">Cancel Order</h2>
            <p className="text-white/70 text-sm mb-6">
              Are you sure you want to cancel this order? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                className="border border-[#F59E0B]/30 text-white rounded-xl px-4 py-2 text-sm hover:bg-[#F59E0B]/5 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={() => { handleCancel(cancelTarget); setCancelTarget(null) }}
                className="bg-red-500 text-white rounded-xl px-4 py-2 text-sm hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory
