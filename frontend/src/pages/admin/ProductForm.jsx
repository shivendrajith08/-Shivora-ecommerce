import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProductById, createProduct, updateProduct } from '../../api/productApi'
import { getCategories } from '../../api/categoryApi'
import { API_ORIGIN } from '../../api/axiosInstance'
import Loader from '../../components/common/Loader'

const ProductForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    sku: '',
    category_id: '',
    is_active: true,
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const catRes = await getCategories()
        setCategories(catRes.data.categories)

        if (isEdit) {
          const prodRes = await getProductById(id)
          const p = prodRes.data.product
          setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price ?? '',
            discount_price: p.discount_price ?? '',
            stock: p.stock ?? '',
            sku: p.sku || '',
            category_id: p.category_id || '',
            is_active: p.is_active,
          })
          if (p.image_url) {
            setImagePreview(p.image_url.startsWith('http') ? p.image_url : `${API_ORIGIN}${p.image_url}`)
          }
        }
      } catch (err) {
        toast.error('Could not load product data')
        navigate('/admin/products')
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Product name is required'
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Price must be a positive number'
    if (form.discount_price && Number(form.discount_price) >= Number(form.price)) {
      newErrors.discount_price = 'Discount price must be less than regular price'
    }
    if (form.stock === '' || Number(form.stock) < 0) newErrors.stock = 'Stock must be zero or a positive integer'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      if (form.discount_price !== '') formData.append('discount_price', form.discount_price)
      formData.append('stock', form.stock)
      if (form.sku) formData.append('sku', form.sku)
      if (form.category_id) formData.append('category_id', form.category_id)
      formData.append('is_active', form.is_active)
      if (imageFile) formData.append('image', imageFile)

      if (isEdit) {
        await updateProduct(id, formData)
        toast.success('Product updated successfully')
      } else {
        await createProduct(formData)
        toast.success('Product created successfully')
      }
      navigate('/admin/products')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        toast.error(err.response?.data?.message || 'Could not save product')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader fullScreen label="Loading product..." />

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-parchment mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label-text">Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Wireless Headphones" />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div>
          <label className="label-text">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field" placeholder="Describe the product..." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Price (₹)</label>
            <input type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleChange} className="input-field" placeholder="999.00" />
            {errors.price && <p className="error-text">{errors.price}</p>}
          </div>
          <div>
            <label className="label-text">Discount Price (₹) <span className="text-silver-dim font-normal">(optional)</span></label>
            <input type="number" step="0.01" min="0" name="discount_price" value={form.discount_price} onChange={handleChange} className="input-field" placeholder="799.00" />
            {errors.discount_price && <p className="error-text">{errors.discount_price}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Stock Quantity</label>
            <input type="number" min="0" name="stock" value={form.stock} onChange={handleChange} className="input-field" placeholder="50" />
            {errors.stock && <p className="error-text">{errors.stock}</p>}
          </div>
          <div>
            <label className="label-text">SKU <span className="text-silver-dim font-normal">(auto-generated if blank)</span></label>
            <input name="sku" value={form.sku} onChange={handleChange} className="input-field" placeholder="PROD-12345" />
          </div>
        </div>

        <div>
          <label className="label-text">Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text">Product Image</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg bg-surface-raised overflow-hidden flex-shrink-0 flex items-center justify-center border border-surface-border">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159" />
                </svg>
              )}
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} className="text-sm text-silver-muted file:mr-3 file:btn-secondary file:text-xs file:cursor-pointer" />
          </div>
          {errors.image && <p className="error-text">{errors.image}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4" style={{ accentColor: '#C9A24B' }} />
          <label htmlFor="is_active" className="text-sm font-medium text-silver-muted">Product is active and visible to customers</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary !px-6">
            {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary !px-6">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
