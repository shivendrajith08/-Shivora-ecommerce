import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { adminGetOrders, adminUpdateOrderStatus, adminGetOrderDetail } from '../../api/adminApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_STYLES = {
  pending:    'bg-amber-900/30 text-amber-300',
  processing: 'bg-blue-900/30 text-blue-300',
  shipped:    'bg-purple-900/30 text-purple-300',
  delivered:  'bg-gold/10 text-gold',
  cancelled:  'bg-red-900/30 text-red-400',
}

const ManageOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadOrders = useCallback(async (page = 1, status = '') => {
    setLoading(true)
    setError('')
    try {
      const params = { page, per_page: 15 }
      if (status) params.status = status
      const res = await adminGetOrders(params)
      setOrders(res.data.orders)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch (err) {
      setError('Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders(1, statusFilter) }, [statusFilter, loadOrders])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await adminUpdateOrderStatus(orderId, newStatus)
      toast.success('Order status updated')
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleExpand = async (orderId) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); setExpandedDetail(null); return }
    setExpandedOrder(orderId)
    setDetailLoading(true)
    try {
      const res = await adminGetOrderDetail(orderId)
      setExpandedDetail(res.data.order)
    } catch (err) {
      toast.error('Could not load order details')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Orders</h1>
          <p className="text-silver-dim text-sm mt-1">{pagination.total} order(s) total</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !w-48">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadOrders(pagination.page, statusFilter)} />}

      <div className="space-y-3">
        {loading ? (
          <Loader label="Loading orders..." />
        ) : orders.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No orders found</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                <button onClick={() => toggleExpand(order.id)} className="flex items-center gap-4 text-left flex-1 min-w-[200px]">
                  <div>
                    <p className="text-xs text-silver-dim">Order #{order.id}</p>
                    <p className="text-sm font-semibold text-parchment">{order.customer_name}</p>
                    <p className="text-xs text-silver-dim">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </button>

                <span className="font-bold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</span>

                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize border-0 cursor-pointer outline-none ${STATUS_STYLES[order.status] || 'bg-surface-raised text-silver-muted'}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>

                <button onClick={() => toggleExpand(order.id)} className="text-silver-dim p-2 -m-2 hover:text-silver-muted">
                  <svg className={`w-5 h-5 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t border-surface-border p-4 bg-surface-raised">
                  {detailLoading ? (
                    <Loader size="sm" label="Loading details..." />
                  ) : expandedDetail ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="text-xs font-semibold text-silver-dim uppercase mb-1.5">Shipping Address</h4>
                          <p className="text-sm text-silver-muted">{expandedDetail.shipping_name}</p>
                          <p className="text-sm text-silver-dim">{expandedDetail.shipping_address}</p>
                          <p className="text-sm text-silver-dim">{expandedDetail.shipping_city}, {expandedDetail.shipping_state} {expandedDetail.shipping_pincode}</p>
                          <p className="text-sm text-silver-dim">{expandedDetail.shipping_phone}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-silver-dim uppercase mb-1.5">Customer</h4>
                          <p className="text-sm text-silver-muted">{expandedDetail.customer_name}</p>
                          <p className="text-sm text-silver-dim">{expandedDetail.customer_email}</p>
                        </div>
                      </div>
                      <h4 className="text-xs font-semibold text-silver-dim uppercase mb-2">Items</h4>
                      <div className="space-y-2">
                        {expandedDetail.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm bg-base rounded-lg px-3 py-2.5">
                            <span className="text-silver-muted">{item.product_name} × {item.quantity}</span>
                            <span className="font-medium text-parchment">₹{item.subtotal.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => loadOrders(pagination.page - 1, statusFilter)} disabled={pagination.page <= 1} className="btn-secondary !py-2 !px-3 text-sm">Previous</button>
          <span className="text-sm text-silver-muted px-3">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => loadOrders(pagination.page + 1, statusFilter)} disabled={pagination.page >= pagination.pages} className="btn-secondary !py-2 !px-3 text-sm">Next</button>
        </div>
      )}
    </div>
  )
}

export default ManageOrders
