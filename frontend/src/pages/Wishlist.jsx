import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getWishlist, removeFromWishlist } from '../api/wishlistApi'
import { useCart } from '../context/CartContext'
import { API_ORIGIN } from '../api/axiosInstance'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'

const Wishlist = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCart()

  const loadWishlist = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getWishlist()
      setItems(res.data.wishlist)
    } catch (err) {
      setError('Could not load your wishlist.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWishlist() }, [])

  const handleRemove = async (wishlistId) => {
    try {
      await removeFromWishlist(wishlistId)
      setItems((prev) => prev.filter((item) => item.id !== wishlistId))
      toast.success('Removed from wishlist')
    } catch (err) {
      toast.error('Could not remove item')
    }
  }

  const handleMoveToCart = async (productId, wishlistId) => {
    const success = await addItem(productId, 1)
    if (success) handleRemove(wishlistId)
  }

  if (loading) return <Loader fullScreen label="Loading wishlist..." />

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-parchment mb-6">My Wishlist</h1>

      {error && <ErrorAlert message={error} onRetry={loadWishlist} />}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-raised flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-parchment mb-2">Your wishlist is empty</h2>
          <p className="text-silver-muted mb-6">Save items you love for later.</p>
          <Link to="/products" className="btn-primary !px-6">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => {
            const product = item.product
            if (!product) return null
            const imageSrc = product.image_url
              ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
              : null
            return (
              <div key={item.id} className="card overflow-hidden flex flex-col hover:border-gold/40 transition-colors">
                <Link to={`/products/${product.id}`} className="aspect-square bg-surface-raised block">
                  {imageSrc ? (
                    <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-silver-dim">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159" />
                      </svg>
                    </div>
                  )}
                </Link>
                <div className="p-3.5 flex flex-col flex-1">
                  <Link to={`/products/${product.id}`} className="text-sm font-semibold text-parchment line-clamp-2 mb-2 flex-1 hover:text-gold">
                    {product.name}
                  </Link>
                  <span className="font-bold text-parchment mb-3">
                    ₹{(product.discount_price || product.price).toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(product.id, item.id)}
                      disabled={!product.in_stock}
                      className="btn-primary flex-1 !py-2 text-xs"
                    >
                      {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-surface-border text-silver-dim hover:text-red-400 hover:border-red-700/50"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Wishlist
