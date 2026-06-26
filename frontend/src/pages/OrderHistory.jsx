import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrderHistory } from '../api/orderApi'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'

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
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              onTouchEnd={(e) => { e.preventDefault(); navigate(`/orders/${order.id}`); }}
              className="card cursor-pointer hover:bg-white/5 active:opacity-80 transition-colors transition-opacity rounded-xl overflow-hidden select-none touch-manipulation"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] font-semibold text-silver-dim uppercase tracking-wide">
                      Order #{order.id}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-silver-dim">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {order.items?.length > 0 && (
                    <p className="text-xs text-silver-muted mt-0.5 truncate">
                      {order.items[0].product_name}
                      {order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-parchment">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </p>
                    {order.discount_amount > 0 && (
                      <p className="text-[11px] font-semibold text-[#F59E0B] mt-0.5">
                        Saved ₹{order.discount_amount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-silver-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
