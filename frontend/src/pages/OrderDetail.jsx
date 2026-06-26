import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrderDetail, cancelOrder } from '../api/orderApi'
import { API_ORIGIN } from '../api/axiosInstance'
import Loader from '../components/common/Loader'
import OrderTimeline from '../components/order/OrderTimeline'
import ReturnRequestModal from '../components/ReturnRequestModal'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',   dot: 'bg-[#E07A5F]',  badge: 'bg-[rgba(224,122,95,0.12)] text-[#E07A5F]' },
  processing: { label: 'Confirmed', dot: 'bg-[#F59E0B]',  badge: 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' },
  shipped:    { label: 'Shipped',   dot: 'bg-blue-400',   badge: 'bg-blue-900/30 text-blue-300' },
  delivered:  { label: 'Delivered', dot: 'bg-green-400',  badge: 'bg-green-900/30 text-green-400' },
  cancelled:  { label: 'Cancelled', dot: 'bg-red-500',    badge: 'bg-red-900/30 text-red-400' },
}

const RETURN_BADGE = {
  Requested: 'bg-amber-900/30 text-amber-300',
  Approved:  'bg-green-900/30 text-green-400',
  Rejected:  'bg-red-900/30 text-red-400',
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

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [returnOrder, setReturnOrder] = useState(null)

  const loadOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getOrderDetail(orderId)
      setOrder(res.data.order)
    } catch {
      setError('Could not load order details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrder() }, [orderId])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled')
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order')
    } finally {
      setCancelling(false)
      setShowCancelModal(false)
    }
  }

  if (loading) return <Loader fullScreen label="Loading order details..." />

  if (error || !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-silver-muted mb-4">{error || 'Order not found.'}</p>
        <button onClick={() => navigate('/orders')} className="btn-primary !px-6">Back to Orders</button>
      </div>
    )
  }

  const canCancel = order.status === 'pending' || order.status === 'processing'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 rounded-lg text-silver-dim hover:text-parchment hover:bg-white/5 transition-colors"
          aria-label="Back to orders"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-parchment">Order #{order.user_order_number ?? order.id}</h1>
          <p className="text-xs text-silver-dim mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Timeline — hidden for cancelled orders; banner shown below items instead */}
      {order.status !== 'cancelled' && (
        <div className="card px-4 py-4 mb-4">
          <OrderTimeline status={order.status} />
        </div>
      )}

      {/* Items */}
      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-surface-border">
          <p className="text-xs font-bold text-silver-dim uppercase tracking-wide">Items Ordered</p>
        </div>
        <div className="divide-y divide-surface-border">
          {order.items?.map((item) => {
            const imgSrc = !item.product_image || item.product_image.startsWith('/uploads/')
              ? '/placeholder-product.svg'
              : item.product_image.startsWith('http')
                ? item.product_image
                : `${API_ORIGIN}${item.product_image}`

            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={item.product_id ? `/products/${item.product_id}` : '#'} className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-raised border border-surface-border">
                    <img
                      src={imgSrc}
                      alt={item.product_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg' }}
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={item.product_id ? `/products/${item.product_id}` : '#'}
                    className="text-sm font-medium text-parchment hover:text-[#F59E0B] truncate block transition-colors"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-silver-dim mt-0.5">Qty: {item.quantity}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-silver-dim">₹{item.price?.toLocaleString('en-IN')} each</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#FCD34D]">₹{item.subtotal?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancelled notice — shown below items so items remain visible */}
      {order.status === 'cancelled' && (
        <div className="card px-4 py-4 mb-4">
          <OrderTimeline status={order.status} />
        </div>
      )}

      {/* Order meta */}
      <div className="card px-4 py-4 mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Order ID</p>
            <p className="text-xs font-medium text-silver-muted font-mono">#{order.user_order_number ?? order.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Payment</p>
            <p className="text-xs font-medium text-silver-muted">{order.payment_method || 'Cash on Delivery'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Order Total</p>
            <p className="text-sm font-bold text-[#FCD34D]">₹{order.total_amount?.toLocaleString('en-IN')}</p>
            {order.discount_amount > 0 && (
              <p className="text-xs text-[#F59E0B] mt-0.5">
                Saved ₹{order.discount_amount?.toLocaleString('en-IN')}
                {order.applied_coupon_code ? ` (${order.applied_coupon_code})` : ''}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-silver-dim uppercase tracking-wide mb-1">Deliver To</p>
            <p className="text-xs font-medium text-silver-muted">{order.shipping_name}</p>
            <p className="text-[11px] text-silver-dim">{order.shipping_address}</p>
            <p className="text-[11px] text-silver-dim">
              {order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              className="text-sm px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}

          {order.status === 'delivered' && (
            order.return_request ? (
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${RETURN_BADGE[order.return_request.status] ?? RETURN_BADGE.Requested}`}>
                Return {order.return_request.status}
              </span>
            ) : (
              <button
                onClick={() => setReturnOrder(order)}
                className="text-sm px-4 py-2 rounded-lg border border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
              >
                Request Return
              </button>
            )
          )}

          {order.status === 'delivered' && order.items?.some(i => i.product_id) && (
            <Link
              to={`/products/${order.items.find(i => i.product_id)?.product_id}`}
              className="text-sm px-4 py-2 rounded-lg border border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
            >
              Rate &amp; Review
            </Link>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowCancelModal(false)}
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
                onClick={() => setShowCancelModal(false)}
                className="border border-[#F59E0B]/30 text-white rounded-xl px-4 py-2 text-sm hover:bg-[#F59E0B]/5 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-500 text-white rounded-xl px-4 py-2 text-sm hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {returnOrder && (
        <ReturnRequestModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSubmitted={() => { setReturnOrder(null); loadOrder() }}
        />
      )}
    </div>
  )
}

export default OrderDetail
