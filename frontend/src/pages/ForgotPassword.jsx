import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { resetPassword } from '../api/authApi'

const ForgotPassword = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', new_password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!form.new_password || form.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters'
    }
    if (form.new_password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await resetPassword({ email: form.email.trim(), new_password: form.new_password })
      toast.success('Password reset successful. Please log in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err.response?.status === 404) {
        setErrors({ email: 'No account found with that email' })
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        toast.error(err.response?.data?.message || 'Could not reset password. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-parchment">Reset your password</h1>
          <p className="text-silver-muted mt-1.5">Enter your email and choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label-text">Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label className="label-text">New Password</label>
            <input type="password" name="new_password" value={form.new_password} onChange={handleChange} className="input-field" placeholder="At least 6 characters" autoComplete="new-password" />
            {errors.new_password && <p className="error-text">{errors.new_password}</p>}
          </div>

          <div>
            <label className="label-text">Confirm New Password</label>
            <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} className="input-field" placeholder="Re-enter new password" autoComplete="new-password" />
            {errors.confirm_password && <p className="error-text">{errors.confirm_password}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-sm text-silver-muted mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-[#C0C0C0] font-semibold hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
