import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getReturns, approveReturn, rejectReturn } from '../../api/returnApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const STATUS_BADGE = {
  Requested: 'bg-amber-900/30 text-amber-300',
  Approved:  'bg-green-900/30 text-green-400',
  Rejected:  'bg-red-900/30 text-red-400',
}

const ManageReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)   // row showing the inline reject input
  const [rejectNote, setRejectNote] = useState('')

  const loadReturns = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getReturns()
      setReturns(res.data.returns)
    } catch {
      setError('Could not load return requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReturns() }, [])

  const handleApprove = async (rr) => {
    if (!window.confirm(`Approve return for Order #${rr.order_id}?`)) return
    setActingId(rr.id)
    try {
      await approveReturn(rr.id, {})
      toast.success('Return approved')
      loadReturns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve return')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (rr) => {
    const note = rejectNote.trim()
    if (!note) { toast.error('A rejection note is required'); return }
    setActingId(rr.id)
    try {
      await rejectReturn(rr.id, { admin_note: note })
      toast.success('Return rejected')
      setRejectingId(null)
      setRejectNote('')
      loadReturns()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.admin_note || 'Could not reject return')
    } finally {
      setActingId(null)
    }
  }

  const pendingCount = returns.filter((r) => r.status === 'Requested').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Returns</h1>
          <p className="text-silver-dim text-sm mt-1">
            {returns.length} request{returns.length === 1 ? '' : 's'}
            {pendingCount > 0 && <span className="text-amber-300"> · {pendingCount} pending</span>}
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadReturns} />}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading returns..." />
        ) : returns.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No return requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Requested</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((rr) => (
                  <tr key={rr.id} className="border-t border-surface-border align-top hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-parchment whitespace-nowrap">#{rr.order_id}</td>
                    <td className="px-4 py-3 text-silver-muted">
                      <p className="text-parchment">{rr.customer_name || '—'}</p>
                      <p className="text-xs text-silver-dim">{rr.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-silver-muted max-w-xs">
                      <p>{rr.reason}</p>
                      {rr.description && <p className="text-xs text-silver-dim mt-0.5">{rr.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-silver-muted whitespace-nowrap">
                      {new Date(rr.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[rr.status] ?? STATUS_BADGE.Requested}`}>
                        {rr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rr.status === 'Requested' ? (
                        rejectingId === rr.id ? (
                          <div className="flex flex-col items-end gap-2 min-w-[200px]">
                            <input
                              autoFocus
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="Rejection note (required)"
                              className="input-field !py-1.5 text-xs w-full"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleReject(rr)} disabled={actingId === rr.id} className="text-xs font-semibold text-red-400 hover:underline disabled:opacity-50">
                                {actingId === rr.id ? 'Rejecting…' : 'Confirm Reject'}
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectNote('') }} className="text-xs font-semibold text-silver-muted hover:text-parchment hover:underline">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprove(rr)} disabled={actingId === rr.id} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors disabled:opacity-50">
                              Approve
                            </button>
                            <button onClick={() => { setRejectingId(rr.id); setRejectNote('') }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${rr.status === 'Approved' ? 'text-green-400' : 'text-red-400'}`}>{rr.status}</p>
                          {rr.admin_note && <p className="text-[11px] text-silver-dim mt-0.5 max-w-[220px] ml-auto">{rr.admin_note}</p>}
                        </div>
                      )}
                    </td>
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

export default ManageReturns
