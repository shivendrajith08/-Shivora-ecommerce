import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { addToWishlist } from '../../api/wishlistApi'
import { useWishlist } from '../../context/WishlistContext'
import { API_ORIGIN } from '../../api/axiosInstance'

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [adding, setAdding] = useState(false)
  const [localWishlisted, setLocalWishlisted] = useState(null)

  const imageSrc = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
    : null

  const hasDiscount = product.discount_price && product.discount_price < product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart')
      return
    }
    if (!product.in_stock) return
    setAdding(true)
    await addItem(product.id, 1)
    setAdding(false)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please log in to use your wishlist')
      return
    }
    const prev = isWishlisted(product.id)
    // Flip instantly in the synchronous event-handler phase so React flushes
    // the paint before any network work starts — this is the optimistic update.
    setLocalWishlisted(!prev)
    toggleWishlist(product.id)
      .then(() => setLocalWishlisted(null))   // API succeeded — let context take over
      .catch(() => setLocalWishlisted(prev))  // API failed — revert the icon
  }

  const wishlisted = localWishlisted !== null ? localWishlisted : isWishlisted(product.id)

  const hasDeal = hasDiscount && discountPercent >= 20
  const isBestseller = !hasDeal && product.id % 3 !== 2

  return (
    <Link to={`/products/${product.id}`} className="card overflow-hidden group hover:border-gold/40 hover:shadow-lg transition-all flex flex-col rounded-xl">
      {/* Image */}
      <div className="relative aspect-square bg-surface-raised overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-silver-dim">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 11.25V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 19.5V11.25m-18 0V8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v3M3 11.25h18M8.25 6V4.5a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25V6" />
            </svg>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        )}

        <button
          onClick={handleWishlistToggle}
          className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition ${wishlisted ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-black/40 hover:bg-black/60 text-silver-dim hover:text-red-400'}`}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            fill={wishlisted ? 'currentColor' : 'none'}>
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-surface text-parchment text-[10px] font-bold px-2.5 py-1 rounded-full border border-surface-border">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Badge strip */}
      {(hasDeal || isBestseller) && (
        <div className="px-1.5 pt-1 sm:px-2 sm:pt-1.5">
          {hasDeal && (
            <span className="inline-block bg-amber-900/30 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-700/30 uppercase tracking-wide">
              Deal
            </span>
          )}
          {isBestseller && (
            <span className="inline-block bg-gold/10 text-gold text-[10px] font-extrabold px-2 py-0.5 rounded border border-gold/30 uppercase tracking-wide">
              Bestseller
            </span>
          )}
        </div>
      )}

      {/* Info — slightly tighter padding on mobile so 2-col cards don't feel cramped */}
      <div className="px-2 pt-1.5 pb-2 sm:px-2 sm:pt-1.5 sm:pb-2 flex flex-col flex-1">
        {product.category_name && (
          <span className="text-[10px] font-medium text-gold uppercase tracking-wide mb-0.5">{product.category_name}</span>
        )}
        <h3 className="text-xs sm:text-xs font-semibold text-parchment line-clamp-2 mb-1 flex-1 leading-snug">{product.name}</h3>

        {product.avg_rating != null && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex leading-none">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= Math.round(product.avg_rating) ? 'text-amber-400 text-xs' : 'text-silver-dim text-xs'}>★</span>
              ))}
            </div>
            <span className="text-[10px] text-silver-dim">({product.review_count})</span>
          </div>
        )}

        <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
          <span className="text-sm font-bold text-parchment sm:text-sm">
            ₹{(hasDiscount ? product.discount_price : product.price).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <>
              <span className="text-[10px] text-silver-dim line-through">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-bold text-gold">{discountPercent}% off</span>
            </>
          )}
        </div>

        {/* Stock indicator */}
        {product.stock === 0 ? (
          <span className="self-start bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2">Out of Stock</span>
        ) : product.stock <= 5 ? (
          <span className="text-[10px] font-semibold text-amber-400 mb-2">Only {product.stock} left!</span>
        ) : null}

        <button
          onClick={handleAddToCart}
          disabled={adding || !product.in_stock}
          className="btn-primary w-full !py-1.5 sm:!py-2 text-xs"
        >
          {adding ? 'Adding...' : product.in_stock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  )
}

export default ProductCard
