import React, { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { getProductById, getProducts } from '../api/productApi'
import { addToWishlist, removeFromWishlistByProduct } from '../api/wishlistApi'
import { getProductReviews, createReview } from '../api/reviewApi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { API_ORIGIN } from '../api/axiosInstance'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'
import ProductCard from '../components/product/ProductCard'
import { addToRecentlyViewed, getRecentlyViewed } from '../utils/recentlyViewed'

const Stars = ({ rating, interactive = false, onSelect }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => interactive && onSelect?.(s)}
        className={[
          'text-xl leading-none',
          s <= rating ? 'text-[#FCD34D]' : 'text-silver-dim',
          interactive ? 'cursor-pointer hover:text-[#FCD34D] transition-colors' : '',
        ].join(' ')}
      >★</span>
    ))}
  </div>
)

const ProductDetails = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [wishing, setWishing] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [recentlyViewed, setRecentlyViewed] = useState([])

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [related, setRelated] = useState([])

  useEffect(() => {
    if (!product?.category_id) { setRelated([]); return }
    let active = true
    getProducts({ category_id: product.category_id, per_page: 12 })
      .then((res) => {
        if (!active) return
        const others = (res.data.products || []).filter((p) => p.id !== product.id).slice(0, 4)
        setRelated(others)
      })
      .catch(() => { if (active) setRelated([]) })
    return () => { active = false }
  }, [product?.id, product?.category_id])

  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        image_url: product.image_url || product.image,
        price: product.price,
        discount_price: product.discount_price,
      })
      const recent = getRecentlyViewed().filter(p => p.id !== product.id)
      setRecentlyViewed(recent)
    }
  }, [product])

  useEffect(() => {
    if (!lightboxSrc) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [lightboxSrc])

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const mimeOk = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    const ext = file.name.split('.').pop().toLowerCase()
    const extOk = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    if (!mimeOk && !extOk) { toast.error('Only JPG, PNG, or WebP images are allowed'); e.target.value = ''; return }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const loadProduct = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProductById(id)
      const prod = res.data.product
      setProduct(prod)
      setQuantity(1)
    } catch (err) {
      setError(err.response?.status === 404 ? 'Product not found.' : 'Could not load product details.')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await getProductReviews(id)
      setReviews(res.data.reviews)
    } catch {} finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
    loadReviews()
    setSubmitSuccess(false)
    setSubmitError(null)
    setReviewForm({ rating: 0, comment: '' })
    clearImage()
    setDescExpanded(false)
    setSelectedSize(null)
    setSelectedColor(null)
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <Loader fullScreen label="Loading product..." />

  if (error || !product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
        <ErrorAlert message={error || 'Product not found.'} />
        <Link to="/products" className="inline-block mt-6 text-[#F59E0B] font-semibold hover:underline">
          ← Back to products
        </Link>
      </div>
    )
  }

  const imageSrc = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
    : null

  const hasDiscount = product.discount_price && product.discount_price < product.price
  const effectivePrice = hasDiscount ? product.discount_price : product.price
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0
  const isLongDesc = product.description && product.description.length > 200

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please log in to add items to your cart'); return }
    if (product.sizes?.length > 0 && !selectedSize) { toast.error('Please select a size'); return }
    if (product.colors?.length > 0 && !selectedColor) { toast.error('Please select a color'); return }
    setAdding(true)
    await addItem(product.id, quantity)
    setAdding(false)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return
    }
    navigate('/checkout', {
      state: {
        buyNow: { productId: product.id, quantity, name: product.name, price: effectivePrice },
      },
    })
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Shivora — ₹${(product.discount_price || product.price).toLocaleString('en-IN')}`,
      url: window.location.href,
    }
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (reviewForm.rating === 0) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createReview({ product_id: Number(id), rating: reviewForm.rating, comment: reviewForm.comment || null, image: imageFile || undefined })
      setSubmitSuccess(true)
      setReviewForm({ rating: 0, comment: '' })
      clearImage()
      await loadReviews()
    } catch (err) {
      const status = err.response?.status
      if (status === 403) setSubmitError("You can only review products you've purchased.")
      else if (status === 409) setSubmitError('You have already reviewed this product.')
      else setSubmitError('Could not submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { toast.error('Please log in to use your wishlist'); return }
    setWishing(true)
    try {
      if (isWishlisted) {
        await removeFromWishlistByProduct(product.id)
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await addToWishlist(product.id)
        setIsWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update wishlist')
    } finally {
      setWishing(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
      {product && <SEO title={product.name} description={`Buy ${product.name} at ₹${(product.discount_price || product.price).toLocaleString('en-IN')}. ${product.description?.slice(0, 120) || ''}`} image={product.image_url || product.image} url={`/products/${product.id}`} type="product" />}
      <nav className="text-sm text-silver-dim mb-6">
        <Link to="/" className="hover:text-[#F59E0B] transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-[#F59E0B] transition-colors">Products</Link>
        {product.category_name && (
          <>
            <span className="mx-2">/</span>
            <span className="text-silver-muted">{product.category_name}</span>
          </>
        )}
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* Image column */}
        <div>
          <div className="relative">
            <div className="w-full aspect-[4/5] sm:aspect-square bg-surface-raised rounded-xl overflow-hidden border border-surface-border">
              {imageSrc ? (
                <Zoom>
                  <img
                    src={imageSrc}
                    alt={product.name}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </Zoom>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-silver-dim">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 11.25V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 19.5V11.25m-18 0V8.25A2.25 2.25 0 015.25 6h13.5A2.25 2.25 0 0121 8.25v3M3 11.25h18M8.25 6V4.5a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25V6" />
                  </svg>
                </div>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="absolute top-3 right-14 w-10 h-10 rounded-full bg-[#060D22]/80 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:border-[#F59E0B]/40 transition-colors"
              title="Share product"
            >
              <svg className="w-4 h-4 text-[#F4F4F2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* Wishlist button */}
            <button
              onClick={handleWishlistToggle}
              disabled={wishing}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#060D22]/80 backdrop-blur-sm flex items-center justify-center border border-white/10 transition-all hover:scale-110"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isWishlisted ? '#E07A5F' : 'none'}
                stroke={isWishlisted ? '#E07A5F' : 'white'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details column */}
        <div>
          {product.category_name && (
            <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wide">{product.category_name}</span>
          )}
          <h1 className="text-xl md:text-3xl font-bold text-parchment mt-1 mb-1.5 leading-tight">{product.name}</h1>

          {product.avg_rating != null ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-lg leading-none ${s <= Math.round(product.avg_rating) ? 'text-[#FCD34D]' : 'text-silver-dim'}`}>★</span>
                ))}
              </div>
              <span className="text-sm text-silver-dim">
                {product.avg_rating.toFixed(1)} ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : <div className="mb-3" />}

          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-[#FCD34D]">₹{effectivePrice.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <>
                <span className="text-base md:text-lg text-silver-muted line-through">₹{product.price.toLocaleString('en-IN')}</span>
                <span className="bg-[rgba(224,122,95,0.12)] text-[#E07A5F] text-xs font-bold px-2 py-1 rounded">-{discountPercent}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-silver-dim mb-2">Inclusive of all taxes</p>

          {/* Low stock urgency */}
          {product.stock > 0 && product.stock <= 10 && (
            <div className="flex items-center gap-2 mt-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E07A5F] animate-pulse flex-shrink-0" />
              <p className="text-sm font-medium text-[#E07A5F]">
                Only {product.stock} left in stock — order soon!
              </p>
            </div>
          )}
          {product.stock === 0 && (
            <p className="text-sm font-semibold text-red-400 mt-2 mb-2">Out of stock</p>
          )}

          <div className="mb-5">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400 bg-red-900/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Out of Stock
              </span>
            )}
          </div>

          {/* Size selector */}
          {product.sizes?.length > 0 && (
            <div className="mt-4 mb-4">
              <p className="text-sm font-medium text-[#F4F4F2] mb-2">Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSize === size
                        ? 'bg-[#F59E0B] border-[#F59E0B] text-[#020818]'
                        : 'border-white/20 text-[#F4F4F2] hover:border-[#F59E0B]/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color picker */}
          {product.colors?.length > 0 && (
            <div className="mt-4 mb-4">
              <p className="text-sm font-medium text-[#F4F4F2] mb-2">
                Color {selectedColor && <span className="text-[#94A3B8] font-normal">— {selectedColor.name}</span>}
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    title={color.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor?.name === color.name
                        ? 'border-[#F59E0B] scale-110'
                        : 'border-transparent hover:border-white/40'
                    }`}
                    style={{ background: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-parchment mb-2">Description</h3>
              <p className={`text-silver-muted text-sm leading-relaxed whitespace-pre-line ${!descExpanded && isLongDesc ? 'line-clamp-3' : ''}`}>
                {product.description}
              </p>
              {isLongDesc && (
                <button
                  onClick={() => setDescExpanded(v => !v)}
                  className="text-[#F59E0B] text-sm font-medium mt-1.5 hover:underline"
                >
                  {descExpanded ? 'Show less ↑' : 'Read more ↓'}
                </button>
              )}
            </div>
          )}

          {product.sku && <p className="text-xs text-silver-dim mb-6">SKU: {product.sku}</p>}

          {product.in_stock && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-silver-muted">Quantity</span>
              <div className="flex items-center border border-surface-border rounded-lg">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-silver-muted hover:text-parchment">−</button>
                <span className="w-10 text-center text-sm font-semibold text-parchment">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-silver-muted hover:text-parchment">+</button>
              </div>
            </div>
          )}

          {/* Action buttons — visible on all screen sizes */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={adding || !product.in_stock}
              className="flex-1 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#020818] font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            {product.in_stock && (
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 rounded-xl bg-[#E07A5F] hover:bg-[#C4603F] text-white font-bold text-sm transition-colors"
              >
                Buy Now
              </button>
            )}
          </div>

          {/* Wishlist button — desktop only (mobile uses image overlay) */}
          <div className="hidden md:flex mt-3">
            <button onClick={handleWishlistToggle} disabled={wishing} className="btn-secondary !px-6 !py-3">
              <svg className="w-5 h-5" fill={isWishlisted ? '#E07A5F' : 'none'} stroke={isWishlisted ? '#E07A5F' : 'currentColor'} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {product.in_stock && (
            <p className="text-xs text-green-400 mt-3">
              🚚 Delivery by {(() => {
                const d = new Date()
                d.setDate(d.getDate() + 3)
                return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
              })()}
            </p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10 md:mt-14">
        <h2 className="text-xl md:text-2xl font-bold text-parchment mb-6">Customer Reviews</h2>

        <div className="space-y-3 mb-10">
          {reviewsLoading ? (
            <p className="text-silver-dim text-sm">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-silver-muted">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border border-surface-border rounded-xl p-3 sm:p-5 bg-surface">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-parchment text-sm sm:text-base">{review.reviewer_name}</span>
                  <span className="text-xs text-silver-dim shrink-0 ml-4">
                    {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <Stars rating={review.rating} />
                {review.comment && <p className="mt-2 text-silver-muted text-sm leading-relaxed">{review.comment}</p>}
                {review.photo_url && (
                  <button type="button" onClick={() => setLightboxSrc(`${API_ORIGIN}${review.photo_url}`)} className="mt-3 block focus:outline-none">
                    <img
                      src={`${API_ORIGIN}${review.photo_url}`}
                      alt="Review photo"
                      className="w-24 h-24 sm:w-36 sm:h-36 object-cover rounded-lg border border-surface-border cursor-zoom-in hover:opacity-80 transition-opacity"
                    />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isAuthenticated && (
          <div className="border border-surface-border rounded-xl p-4 sm:p-6 max-w-xl bg-surface">
            <h3 className="text-lg font-semibold text-parchment mb-4">Write a Review</h3>

            {submitSuccess ? (
              <p className="text-[#F59E0B] font-medium">Thanks for your review!</p>
            ) : (
              <form onSubmit={handleSubmitReview} noValidate>
                {submitError && <p className="text-red-400 text-sm mb-4">{submitError}</p>}

                <div className="mb-4">
                  <label className="label-text">Your Rating</label>
                  <Stars rating={reviewForm.rating} interactive onSelect={(s) => setReviewForm((f) => ({ ...f, rating: s }))} />
                  {reviewForm.rating === 0 && <p className="text-xs text-silver-dim mt-1">Click a star to rate</p>}
                </div>

                <div className="mb-5">
                  <label className="label-text">
                    Comment <span className="text-silver-dim font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product…"
                    className="input-field resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div className="mb-5">
                  <label className="label-text">
                    Photo <span className="text-silver-dim font-normal">(optional)</span>
                  </label>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-surface-border" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface-raised text-parchment rounded-full flex items-center justify-center text-xs hover:bg-red-700 transition-colors border border-surface-border"
                        title="Remove photo"
                      >×</button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer border border-dashed border-surface-border rounded-lg px-3 py-2 text-xs text-silver-dim hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Add photo
                      <input type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" onChange={handleImageChange} />
                    </label>
                  )}
                </div>

                <button type="submit" disabled={submitting || reviewForm.rating === 0} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* You may also like */}
      {related.length > 0 && (
        <div className="mt-10 md:mt-14">
          <h2 className="text-xl md:text-2xl font-bold text-[#F59E0B] mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-8 px-4 pb-24">
          <h2 className="text-lg font-bold text-[#F4F4F2] mb-4">Recently Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentlyViewed.map(item => (
              <div
                key={item.id}
                onClick={() => { navigate(`/products/${item.id}`); window.scrollTo(0, 0); }}
                className="bg-[#060D22] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#F59E0B]/30 active:opacity-80 transition-all touch-manipulation select-none"
              >
                <div className="relative">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                  {item.discount_price && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#E07A5F] text-white px-1.5 py-0.5 rounded">
                      {Math.round((1 - item.discount_price / item.price) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-[#F4F4F2] font-medium leading-snug line-clamp-2">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-bold text-[#FCD34D]">
                      ₹{(item.discount_price || item.price).toLocaleString('en-IN')}
                    </span>
                    {item.discount_price && (
                      <span className="text-xs text-[#94A3B8] line-through">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxSrc(null)}>
          <button type="button" onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl leading-none hover:bg-white/20 transition-colors">×</button>
          <img src={lightboxSrc} alt="Full-size photo" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

export default ProductDetails
