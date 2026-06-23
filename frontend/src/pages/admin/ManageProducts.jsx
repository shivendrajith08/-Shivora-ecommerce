import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminGetProducts, deleteProduct } from '../../api/productApi'
import { API_ORIGIN } from '../../api/axiosInstance'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const ManageProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [deletingId, setDeletingId] = useState(null)

  const loadProducts = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await adminGetProducts({ page, search: searchTerm, per_page: 15 })
      setProducts(res.data.products)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch (err) {
      setError('Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts(1, '') }, [loadProducts])

  const handleSearchSubmit = (e) => { e.preventDefault(); loadProducts(1, search) }

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return
    setDeletingId(productId)
    try {
      await deleteProduct(productId)
      toast.success('Product deleted')
      loadProducts(pagination.page, search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-parchment">Products</h1>
          <p className="text-silver-dim text-sm mt-1">{pagination.total} product(s) total</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary !px-5">+ Add Product</Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input-field" />
        <button type="submit" className="btn-secondary !px-4">Search</button>
      </form>

      {error && <ErrorAlert message={error} onRetry={() => loadProducts(pagination.page, search)} />}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading products..." />
        ) : products.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No products found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imageSrc = product.image_url
                    ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
                    : null
                  return (
                    <tr key={product.id} className="border-t border-surface-border hover:bg-surface-raised/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-raised overflow-hidden flex-shrink-0">
                            {imageSrc && <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-parchment truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-silver-dim">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-silver-muted">{product.category_name || '—'}</td>
                      <td className="px-4 py-3 text-parchment font-medium">
                        ₹{(product.discount_price || product.price).toLocaleString('en-IN')}
                        {product.discount_price && (
                          <span className="text-xs text-silver-dim line-through ml-1.5">₹{product.price.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={product.stock <= 5 ? 'text-red-400 font-semibold' : 'text-silver-muted'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.is_active ? 'bg-green-900/30 text-green-400' : 'bg-surface-raised text-silver-dim'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/products/${product.id}/edit`} className="text-gold hover:underline text-xs font-semibold">Edit</Link>
                          <button onClick={() => handleDelete(product.id, product.name)} disabled={deletingId === product.id} className="text-red-400 hover:underline text-xs font-semibold">
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => loadProducts(pagination.page - 1, search)} disabled={pagination.page <= 1} className="btn-secondary !py-2 !px-3 text-sm">Previous</button>
          <span className="text-sm text-silver-muted px-3">Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => loadProducts(pagination.page + 1, search)} disabled={pagination.page >= pagination.pages} className="btn-secondary !py-2 !px-3 text-sm">Next</button>
        </div>
      )}
    </div>
  )
}

export default ManageProducts
