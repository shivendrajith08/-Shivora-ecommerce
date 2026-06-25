import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getDashboardStats } from '../../api/adminApi'
import StatCard from '../../components/admin/StatCard'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const STATUS_STYLES = {
  pending:    'bg-amber-900/30 text-amber-300',
  processing: 'bg-blue-900/30 text-blue-300',
  shipped:    'bg-purple-900/30 text-purple-300',
  delivered:  'bg-[#C0C0C0]/10 text-[#C0C0C0]',
  cancelled:  'bg-red-900/30 text-red-400',
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#2a0000', border: '1px solid #3a1010', borderRadius: 8, color: '#F5F3EE', fontSize: 12 },
  labelStyle: { color: '#A8AAAD' },
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } catch (err) {
      setError('Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  if (loading) return <Loader fullScreen label="Loading dashboard..." />
  if (error) return <ErrorAlert message={error} onRetry={loadStats} />
  if (!stats) return null

  const chartData = stats.daily_sales.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: d.revenue,
    orders: d.order_count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-parchment">Dashboard</h1>
        <p className="text-silver-dim text-sm mt-1">Overview of your store's performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${stats.total_revenue.toLocaleString('en-IN')}`} color="green" icon="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Total Orders" value={stats.total_orders} color="blue" icon="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.954-4.749 2.466-7.305a1.125 1.125 0 00-1.105-1.345H5.106M7.5 14.25L5.106 5.272" />
        <StatCard label="Total Products" value={stats.total_products} color="purple" icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5" />
        <StatCard label="Total Customers" value={stats.total_users} color="orange" icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21" />
        <StatCard label="Pending Orders" value={stats.pending_orders} color="orange" icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Low Stock Items" value={stats.low_stock_products} color="red" icon="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        <StatCard label="Categories" value={stats.total_categories} color="blue" icon="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <StatCard label="Cancelled Orders" value={stats.orders_by_status?.cancelled || 0} color="red" icon="M6 18L18 6M6 6l12 12" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-parchment mb-4">Revenue — Last 7 Days</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-silver-dim text-center py-16">No sales data for this period yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1010" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8A8C8F' }} stroke="#3a1010" />
                <YAxis tick={{ fontSize: 12, fill: '#8A8C8F' }} stroke="#3a1010" />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="revenue" stroke="#C0C0C0" strokeWidth={2.5} dot={{ r: 4, fill: '#C0C0C0' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-parchment mb-4">Top Selling Products</h3>
          {stats.top_products.length === 0 ? (
            <p className="text-sm text-silver-dim text-center py-16">No sales recorded yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.top_products} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a1010" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#8A8C8F' }} stroke="#3a1010" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#8A8C8F' }} stroke="#3a1010" />
                <Tooltip formatter={(value) => [value, 'Units Sold']} {...CHART_TOOLTIP_STYLE} />
                <Bar dataKey="total_sold" fill="#C0C0C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-parchment">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm font-semibold text-[#C0C0C0] hover:underline">View all →</Link>
        </div>
        {stats.recent_orders.length === 0 ? (
          <p className="text-sm text-silver-dim text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-silver-dim uppercase border-b border-surface-border">
                  <th className="pb-2 font-semibold">Order</th>
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-surface-border/50 last:border-0">
                    <td className="py-3 font-medium text-silver-muted">#{order.id}</td>
                    <td className="py-3 text-silver-muted">{order.customer_name}</td>
                    <td className="py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-surface-raised text-silver-muted'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
