import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { adminGetOrders, adminUpdateOrderStatus, adminGetOrderDetail } from '../../api/adminApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_BADGE = {
  pending:    'bg-amber-900/30 text-amber-300',
  processing: 'bg-blue-900/30 text-blue-300',
  shipped:    'bg-purple-900/30 text-purple-300',
  delivered:  'bg-green-900/30 text-green-300',
  cancelled:  'bg-red-900/30 text-red-400',
}

const ManageOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
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

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return String(o.id).includes(q) || o.customer_name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Orders</h1>
          <p className="text-silver-dim text-sm mt-1">{pagination.total} order(s) total</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by customer or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !w-64"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !w-48">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadOrders(pagination.page, statusFilter)} />}

      {loading ? (
        <Loader label="Loading orders..." />
      ) : orders.length === 0 ? (
        <p className="text-center text-silver-dim py-16">No orders found</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Order ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Items</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-silver-dim uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-silver-dim py-12">No orders match your search</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    onClick={() => toggleExpand(order.id)}
                    className={`border-b border-surface-border cursor-pointer hover:bg-surface-raised transition-colors ${expandedOrder === order.id ? 'bg-surface-raised' : ''}`}
                  >
                    <td className="px-4 py-3 text-silver-dim font-mono">#{order.id}</td>
                    <td className="px-4 py-3 text-parchment font-medium">{order.customer_name}</td>
                    <td className="px-4 py-3 text-silver-dim whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-silver-dim">{order.total_items ?? '–'}</td>
                    <td className="px-4 py-3 text-parchment font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[order.status] || 'bg-surface-raised text-silver-muted'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="input-field !py-1 !text-xs !w-36"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  {expandedOrder === order.id && (
                    <tr className="border-b border-surface-border">
                      <td colSpan={7} className="bg-surface-raised px-6 py-4">
                        {detailLoading ? (
                          <Loader size="sm" label="Loading details..." />
                        ) : expandedDetail ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-silver-dim uppercase tracking-wider">Ordered Items</h4>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left">
                                  <th className="pb-2 text-xs text-silver-dim font-medium">Product</th>
                                  <th className="pb-2 text-xs text-silver-dim font-medium text-center">Qty</th>
                                  <th className="pb-2 text-xs text-silver-dim font-medium text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedDetail.items?.map((item) => (
                                  <tr key={item.id} className="border-t border-surface-border">
                                    <td className="py-2 text-silver-muted">{item.product_name}</td>
                                    <td className="py-2 text-silver-dim text-center">{item.quantity}</td>
                                    <td className="py-2 text-parchment font-medium text-right">₹{item.subtotal.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
