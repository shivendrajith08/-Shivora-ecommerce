import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import { API_ORIGIN } from '../api/axiosInstance'
import ProductCard from '../components/product/ProductCard'
import ProductFilters from '../components/product/ProductFilters'
import PromoCarousel from '../components/common/PromoCarousel'
import CategorySection from '../components/common/CategorySection'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'

const TRUST_BADGES = [
  { title: 'Free Shipping',   desc: 'On orders over ₹999',          icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.83H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { title: 'Secure Payments', desc: 'Cash on delivery available',    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
  { title: 'Easy Returns',    desc: 'Hassle-free order cancellation', icon: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' },
]

const HScrollCard = ({ product }) => {
  const img = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
    : null
  const price = product.discount_price && product.discount_price < product.price
    ? product.discount_price : product.price
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex-shrink-0 w-36 bg-surface rounded-xl overflow-hidden border border-surface-border hover:border-gold/40 transition-all"
    >
      <div className="w-full aspect-square bg-surface-raised overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-silver-dim">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-parchment truncate leading-snug mb-0.5">{product.name}</p>
        <p className="text-xs font-bold text-gold">₹{price.toLocaleString('en-IN')}</p>
      </div>
    </Link>
  )
}

const HScrollRow = ({ title, products }) => {
  if (!products || products.length === 0) return null
  return (
    <div className="mb-2">
      <h2 className="text-base font-bold text-white mb-2">{title}</h2>
      <div
        className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map(p => <HScrollCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showFilters, setShowFilters] = useState(false)

  const [trendingProducts, setTrendingProducts] = useState([])
  const [dealProducts, setDealProducts] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])

  const filters = {
    search:      searchParams.get('search') || '',
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '',
    category:    searchParams.get('category') || '',
    min_price:   searchParams.get('min_price') || '',
    max_price:   searchParams.get('max_price') || '',
    sort:        searchParams.get('sort') || 'newest',
    page:        Number(searchParams.get('page')) || 1,
  }

  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategories()
      setCategories(res.data.categories)
    } catch {}
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...filters, per_page: 12 }
      Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k] })
      const res = await getProducts(params)
      setProducts(res.data.products)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch {
      setError('Could not load products. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { loadProducts() }, [loadProducts])

  // Load trending & deal rows once on mount
  useEffect(() => {
    getProducts({ per_page: 20, sort: 'newest' })
      .then(res => {
        const all = res.data.products || []
        setTrendingProducts(all.slice(0, 8))
        setDealProducts(all.filter(p => p.discount_price && p.discount_price < p.price).slice(0, 10))
      })
      .catch(() => {})
  }, [])

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('shivora_recently_viewed') || '[]')
      setRecentlyViewed(stored)
    } catch {}
  }, [])

  const updateFilters = (newFilters) => {
    const params = {}
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v
    })
    setSearchParams(params)
    setShowFilters(false)
  }

  const clearFilters = () => setSearchParams({})
  const goToPage = (page) => updateFilters({ ...filters, page })

  const activeCategory = categories.find((c) => c.slug === filters.category)
  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : activeCategory
      ? activeCategory.name
      : 'All Products'

  const showHomeSections = !filters.category && !filters.search

  return (
    <>
      {!filters.category && <PromoCarousel />}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!filters.category && (
          <div className="hidden md:block">
            <CategorySection categories={categories} showViewAll={false} />
          </div>
        )}

        {/* Horizontal scroll rows — only on unfiltered home view */}
        {showHomeSections && (trendingProducts.length > 0 || dealProducts.length > 0) && (
          <div className="space-y-5">
            <HScrollRow title="Trending Now" products={trendingProducts} />
            <HScrollRow title="Best Deals" products={dealProducts} />
          </div>
        )}

        <div>
          {/* ── Heading row ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-parchment">{pageTitle}</h1>
              {!loading && (
                <p className="text-xs text-silver-dim mt-0.5">{pagination.total} product(s) found</p>
              )}
            </div>
            {/* Filters toggle — hidden on desktop where sidebar is always visible */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className="lg:hidden btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 min-h-[40px]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>

          {/* ── Tablet collapsible filter panel (md → lg) ───────────────────
              Inline above the product grid; overflow-hidden contains sticky  */}
          {showFilters && (
            <div className="hidden md:block lg:hidden mb-4 overflow-hidden">
              <ProductFilters
                categories={categories}
                filters={filters}
                onChange={updateFilters}
                onClear={clearFilters}
                sticky={false}
              />
            </div>
          )}

          {/* ── Desktop sidebar + product grid ──────────────────────────────── */}
          <div className="grid lg:grid-cols-[260px_1fr] gap-6">

            {/* Desktop sidebar — always visible on lg+ */}
            <div className="hidden lg:block">
              <ProductFilters
                categories={categories}
                filters={filters}
                onChange={updateFilters}
                onClear={clearFilters}
              />
            </div>

            {/* ── Mobile filter bottom sheet (< md) ──────────────────────────
                Fixed overlay that slides up from the bottom of the screen.
                overflow-hidden on the scroll wrapper contains sticky.        */}
            {showFilters && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="fixed inset-0 bg-black/60" onClick={() => setShowFilters(false)} />
                <div
                  className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl border-t border-surface-border flex flex-col overflow-hidden"
                  style={{ animation: 'slide-up 0.25s ease-out', maxHeight: '80vh' }}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-surface-border" />
                  </div>
                  {/* Sheet header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border flex-shrink-0">
                    <h3 className="font-bold text-parchment">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-1 text-silver-muted hover:text-parchment transition-colors"
                      aria-label="Close filters"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <ProductFilters
                      categories={categories}
                      filters={filters}
                      onChange={updateFilters}
                      onClear={clearFilters}
                      sticky={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Product grid ─────────────────────────────────────────────── */}
            <div>
              {error && <ErrorAlert message={error} onRetry={loadProducts} />}

              {loading ? (
                <Loader fullScreen label="Loading products..." />
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-silver-muted text-lg mb-2">No products found</p>
                  <p className="text-silver-dim text-sm">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <>
                  {/* Mobile: 2 cols · Tablet: 3 cols · Desktop (in 1fr): 4 cols on xl */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="btn-secondary !py-2 !px-3 text-sm"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-silver-muted px-3">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="btn-secondary !py-2 !px-3 text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <HScrollRow title="Recently Viewed" products={recentlyViewed} />
        )}

        <section className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-surface-border">
          {TRUST_BADGES.map((item) => (
            <div key={item.title} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={item.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-parchment">{item.title}</p>
                <p className="text-xs text-silver-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

export default Home
