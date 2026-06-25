import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const AdminLogin = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address'
    if (!form.password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const userData = await login(form)
      if (userData.role !== 'admin') { toast.error('This account does not have admin access'); return }
      toast.success('Welcome to the admin panel')
      navigate('/admin/dashboard')
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gold-shine)' }}>
            <svg className="w-7 h-7" style={{ color: '#0d0000' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 4.556-3.04 8.4-7.2 9.62a1.5 1.5 0 01-.6 0C9.04 20.4 6 16.556 6 12V5.25a.75.75 0 01.75-.75c1.96 0 3.81-.6 5.25-1.5 1.44.9 3.29 1.5 5.25 1.5a.75.75 0 01.75.75V12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-parchment">Admin Panel</h1>
          <p className="text-silver-muted mt-1.5">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label-text">Admin Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="admin@example.com" autoComplete="email" />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label className="label-text">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="••••••••" autoComplete="current-password" />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-silver-dim mt-6">
          <Link to="/" className="hover:text-parchment transition-colors">← Back to store</Link>
        </p>
      </div>
    </div>
  )
}

export default AdminLogin
