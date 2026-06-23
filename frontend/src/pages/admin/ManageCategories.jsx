import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoryApi'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const ManageCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getCategories(true)
      setCategories(res.data.categories)
    } catch (err) {
      setError('Could not load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  const openCreateForm = () => { setEditingId(null); setForm({ name: '', description: '' }); setFormErrors({}); setShowForm(true) }
  const openEditForm = (category) => { setEditingId(category.id); setForm({ name: category.name, description: category.description || '' }); setFormErrors({}); setShowForm(true) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormErrors({ name: 'Category name is required' }); return }
    setSubmitting(true)
    try {
      if (editingId) { await updateCategory(editingId, form); toast.success('Category updated') }
      else { await createCategory(form); toast.success('Category created') }
      setShowForm(false)
      loadCategories()
    } catch (err) {
      if (err.response?.data?.errors) setFormErrors(err.response.data.errors)
      else toast.error(err.response?.data?.message || 'Could not save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return
    setDeletingId(category.id)
    try {
      await deleteCategory(category.id)
      toast.success('Category deleted')
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Categories</h1>
          <p className="text-silver-dim text-sm mt-1">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'} total</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary !px-5">+ Add Category</button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadCategories} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-lg">
          <h3 className="font-bold text-parchment">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <div>
            <label className="label-text">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Electronics" />
            {formErrors.name && <p className="error-text">{formErrors.name}</p>}
          </div>
          <div>
            <label className="label-text">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary !px-5">
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !px-5">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading categories..." />
        ) : categories.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No categories yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t border-surface-border hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-parchment">{cat.name}</td>
                    <td className="px-4 py-3 text-silver-muted max-w-xs truncate">{cat.description || '—'}</td>
                    <td className="px-4 py-3 text-silver-muted">{cat.product_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditForm(cat)} className="text-gold hover:underline text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDelete(cat)} disabled={deletingId === cat.id} className="text-red-400 hover:underline text-xs font-semibold">
                          {deletingId === cat.id ? 'Deleting...' : 'Delete'}
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

export default ManageCategories
