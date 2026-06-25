import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { createReturn } from '../api/returnApi'
import { API_ORIGIN } from '../api/axiosInstance'

const REASONS = ['Damaged product', 'Wrong item received', 'Not as described', 'Changed my mind', 'Other']

const ReturnRequestModal = ({ order, onClose, onSubmitted }) => {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) { setError('Please select a reason'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await createReturn(order.id, { reason, description: description.trim() || undefined })
      toast.success('Return request submitted')
      onSubmitted(res.data.return_request)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.reason || 'Could not submit return request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface rounded-xl border border-surface-border shadow-2xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
            <h2 className="text-lg font-bold text-[#C0C0C0]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Request Return</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-silver-dim hover:text-parchment hover:bg-surface-raised rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Order summary */}
            <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-silver-dim uppercase tracking-wide">Order #{order.id}</p>
                <p className="text-sm font-bold text-parchment">₹{order.total_amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {order.items?.slice(0, 5).map((item) => (
                  <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden bg-surface border border-surface-border flex-shrink-0" title={item.product_name}>
                    {item.product_image ? (
                      <img
                        src={item.product_image.startsWith('/uploads/') ? '/placeholder-product.svg' : item.product_image.startsWith('http') ? item.product_image : `${API_ORIGIN}${item.product_image}`}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-silver-dim text-[10px]">N/A</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">Reason*</label>
              <select value={reason} onChange={(e) => { setReason(e.target.value); if (error) setError('') }} className="input-field">
                <option value="">Select a reason</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">Additional details <span className="text-silver-dim font-normal">(optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell us more about the issue…" />
            </div>

            {error && <p className="error-text">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-surface-border flex-shrink-0">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 !py-2.5">
              {submitting ? 'Submitting…' : 'Submit Return Request'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary !px-5">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReturnRequestModal
