import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../api/couponApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discount_percent: '', min_order_amount: '', max_uses: '' })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const loadCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCoupons()
      setCoupons(res.data.coupons)
    } catch {
      setError('Could not load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCoupons() }, [])

  const openCreateForm = () => {
    setForm({ code: '', discount_percent: '', min_order_amount: '', max_uses: '' })
    setFormErrors({})
    setShowForm(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.code.trim()) errs.code = 'Code is required'
    const dp = Number(form.discount_percent)
    if (!form.discount_percent || isNaN(dp) || dp < 1 || dp > 100) errs.discount_percent = 'Discount must be 1–100'
    setFormErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      await createCoupon({
        code: form.code.trim(),
        discount_percent: dp,
        min_order_amount: form.min_order_amount === '' ? 0 : Number(form.min_order_amount),
        max_uses: form.max_uses === '' ? null : Number(form.max_uses),
      })
      toast.success('Coupon created')
      setShowForm(false)
      loadCoupons()
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors)
      else toast.error(err.response?.data?.message || 'Could not create coupon')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (coupon) => {
    setTogglingId(coupon.id)
    try {
      await updateCoupon(coupon.id, { active: !coupon.active })
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)))
    } catch {
      toast.error('Could not update coupon')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return
    setDeletingId(coupon.id)
    try {
      await deleteCoupon(coupon.id)
      toast.success('Coupon deleted')
      loadCoupons()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete coupon')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Coupons</h1>
          <p className="text-silver-dim text-sm mt-1">{coupons.length} coupon{coupons.length === 1 ? '' : 's'} total</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary !px-5">+ Create New Coupon</button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadCoupons} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-lg">
          <h3 className="font-bold text-parchment">New Coupon</h3>
          <div>
            <label className="label-text">Code</label>
            <input name="code" value={form.code} onChange={handleChange} className="input-field uppercase" placeholder="SAVE10" maxLength={20} />
            {formErrors.code && <p className="error-text">{formErrors.code}</p>}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Discount %</label>
              <input name="discount_percent" type="number" min="1" max="100" value={form.discount_percent} onChange={handleChange} className="input-field" placeholder="10" />
              {formErrors.discount_percent && <p className="error-text">{formErrors.discount_percent}</p>}
            </div>
            <div>
              <label className="label-text">Min Order <span className="text-silver-dim font-normal">(₹, opt)</span></label>
              <input name="min_order_amount" type="number" min="0" value={form.min_order_amount} onChange={handleChange} className="input-field" placeholder="0" />
              {formErrors.min_order_amount && <p className="error-text">{formErrors.min_order_amount}</p>}
            </div>
            <div>
              <label className="label-text">Max Uses <span className="text-silver-dim font-normal">(opt)</span></label>
              <input name="max_uses" type="number" min="1" value={form.max_uses} onChange={handleChange} className="input-field" placeholder="∞" />
              {formErrors.max_uses && <p className="error-text">{formErrors.max_uses}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary !px-5">{submitting ? 'Creating…' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !px-5">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading coupons..." />
        ) : coupons.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No coupons yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Min Order</th>
                  <th className="px-4 py-3 font-semibold">Uses</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-surface-border hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#F59E0B]">{c.code}</td>
                    <td className="px-4 py-3 text-parchment">{c.discount_percent}%</td>
                    <td className="px-4 py-3 text-silver-muted">{c.min_order_amount > 0 ? `₹${c.min_order_amount.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-3 text-silver-muted">{c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={togglingId === c.id}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                          c.active ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-surface-raised text-silver-dim border border-surface-border'
                        }`}
                        title="Toggle active"
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleDelete(c)} disabled={deletingId === c.id} className="text-red-400 hover:underline text-xs font-semibold">
                          {deletingId === c.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
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

export default ManageCoupons
