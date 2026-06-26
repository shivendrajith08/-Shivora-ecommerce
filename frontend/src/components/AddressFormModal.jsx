import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { createAddress, updateAddress } from '../api/addressApi'

const AddressFormModal = ({ address, onClose, onSaved }) => {
  const isEdit = Boolean(address)

  const [form, setForm] = useState({
    full_name:     address?.full_name     ?? '',
    phone:         address?.phone         ?? '',
    address_line1: address?.address_line1 ?? '',
    address_line2: address?.address_line2 ?? '',
    city:          address?.city          ?? '',
    state:         address?.state         ?? '',
    pincode:       address?.pincode       ?? '',
    is_default:    address?.is_default    ?? false,
  })
  const [errors, setErrors]       = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim())     e.full_name = 'Full name is required'
    if (!form.phone.trim())         e.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number'
    if (!form.address_line1.trim()) e.address_line1 = 'Address line 1 is required'
    if (!form.city.trim())          e.city = 'City is required'
    if (!form.state.trim())         e.state = 'State is required'
    if (!form.pincode.trim())       e.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEdit) {
        await updateAddress(address.id, form)
        toast.success('Address updated')
      } else {
        await createAddress(form)
        toast.success('Address saved')
      }
      onSaved()
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      toast.error(err.response?.data?.message || 'Could not save address')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-surface rounded-xl border border-surface-border shadow-2xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
            <h2 className="text-lg font-bold text-parchment">
              {isEdit ? 'Edit Address' : 'Add Address'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-silver-dim hover:text-parchment hover:bg-surface-raised rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Full Name*</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.full_name && <p className="error-text">{errors.full_name}</p>}
              </div>
              <div>
                <label className="label-text">Phone*</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="label-text">Address Line 1*</label>
              <input
                name="address_line1"
                value={form.address_line1}
                onChange={handleChange}
                className="input-field"
                placeholder="House no., street, locality"
              />
              {errors.address_line1 && <p className="error-text">{errors.address_line1}</p>}
            </div>

            <div>
              <label className="label-text">
                Address Line 2{' '}
                <span className="text-silver-dim font-normal">(optional)</span>
              </label>
              <input
                name="address_line2"
                value={form.address_line2}
                onChange={handleChange}
                className="input-field"
                placeholder="Apartment, landmark, etc."
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label-text">City*</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Bengaluru"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>
              <div>
                <label className="label-text">State*</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Karnataka"
                />
                {errors.state && <p className="error-text">{errors.state}</p>}
              </div>
              <div>
                <label className="label-text">Pincode*</label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="560001"
                  maxLength={6}
                />
                {errors.pincode && <p className="error-text">{errors.pincode}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={handleChange}
                style={{ accentColor: '#F59E0B' }}
              />
              <span className="text-sm text-silver-muted">Set as default address</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-surface-border flex-shrink-0">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 !py-2.5">
              {submitting ? 'Saving...' : 'Save Address'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary !px-5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddressFormModal
