import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { adminGetUsers, adminToggleUserStatus } from '../../api/adminApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const ManageUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [togglingId, setTogglingId] = useState(null)

  const loadUsers = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await adminGetUsers({ page, search: searchTerm, per_page: 15 })
      setUsers(res.data.users)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch (err) {
      setError('Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers(1, '') }, [loadUsers])

  const handleSearchSubmit = (e) => { e.preventDefault(); loadUsers(1, search) }

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return
    setTogglingId(user.id)
    try {
      const res = await adminToggleUserStatus(user.id)
      toast.success(res.data.message)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user status')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-parchment">Customers</h1>
        <p className="text-silver-dim text-sm mt-1">{pagination.total} registered customer(s)</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="input-field" />
        <button type="submit" className="btn-secondary !px-4">Search</button>
      </form>

      {error && <ErrorAlert message={error} onRetry={() => loadUsers(pagination.page, search)} />}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading customers..." />
        ) : users.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-surface-border hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-parchment">{user.name}</td>
                    <td className="px-4 py-3 text-silver-muted">{user.email}</td>
                    <td className="px-4 py-3 text-silver-muted">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-silver-dim text-xs">
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingId === user.id}
                        className={`text-xs font-semibold hover:underline ${user.is_active ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {togglingId === user.id ? 'Updating...' : user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => loadUsers(pagination.page - 1, search)} disabled={pagination.page <= 1} className="btn-secondary !py-2 !px-3 text-sm">Previous</button>
          <span className="text-sm text-silver-muted px-3">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => loadUsers(pagination.page + 1, search)} disabled={pagination.page >= pagination.pages} className="btn-secondary !py-2 !px-3 text-sm">Next</button>
        </div>
      )}
    </div>
  )
}

export default ManageUsers
