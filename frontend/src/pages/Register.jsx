import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim() || form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address'
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) newErrors.phone = 'Enter a valid phone number'
    if (!form.password || form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const { confirmPassword, ...payload } = form
      const userData = await register(payload)
      toast.success(`Welcome to Shivora, ${userData.name}!`)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-parchment">Create your account</h1>
          <p className="text-silver-muted mt-1.5">Join Shivora and start shopping today</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="John Doe" autoComplete="name" />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div>
            <label className="label-text">Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" autoComplete="email" />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label className="label-text">
              Phone Number <span className="text-silver-dim font-normal">(optional)</span>
            </label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" autoComplete="tel" />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>

          <div>
            <label className="label-text">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="At least 6 characters" autoComplete="new-password" />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <label className="label-text">Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input-field" placeholder="Re-enter password" autoComplete="new-password" />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-silver-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gold font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
