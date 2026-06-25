import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import ProductCard from '../components/product/ProductCard'
import ProductFilters from '../components/product/ProductFilters'
import CategorySection from '../components/common/CategorySection'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'top_rated', label: 'Top Rated' },
]

// Price shown on the card (discounted if present) — what we filter/sort on.
const effectivePrice = (p) => (p.discount_price != null ? p.discount_price : p.price)

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef(null)

  // Sort + price are applied CLIENT-SIDE on the fetched list (category + search stay server-side).
  const [sortBy, setSortBy] = useState('relevance')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // Category + search live in the URL (unchanged category-filter logic).
  const urlFilters = {
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '',
    category: searchParams.get('category') || '',
  }

  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategories()
      setCategories(res.data.categories)
    } catch (err) {}
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch the full category/search result set so client-side sort + price act on everything.
      const params = { ...urlFilters, per_page: 50 }
      Object.keys(params).forEach((k) => (params[k] === '' && delete params[k]))
      const res = await getProducts(params)
      setProducts(res.data.products)
    } catch (err) {
      setError('Could not load products. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => {
    loadProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [loadProducts])

  // Close sort dropdown when user clicks outside it
  useEffect(() => {
    if (!showSortDropdown) return
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSortDropdown])

  const openMobileFilters = () => {
    setShowSortDropdown(false)
    setShowMobileFilters(true)
  }

  const toggleSortDropdown = () => {
    const opening = !showSortDropdown
    if (opening) setShowMobileFilters(false)
    setShowSortDropdown(opening)
  }

  // Client-side: filter by price range, then sort.
  const visibleProducts = useMemo(() => {
    const min = priceMin !== '' ? Number(priceMin) : null
    const max = priceMax !== '' ? Number(priceMax) : null

    let list = products.filter((p) => {
      const price = effectivePrice(p)
      if (min != null && price < min) return false
      if (max != null && price > max) return false
      return true
    })

    list = [...list]
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break
      case 'price_desc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break
      case 'newest':
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break
      case 'top_rated':
        list.sort((a, b) =>
          (b.avg_rating ?? -1) - (a.avg_rating ?? -1) ||
          (b.review_count || 0) - (a.review_count || 0)); break
      default:
        break // 'relevance' — keep server order
    }
    return list
  }, [products, priceMin, priceMax, sortBy])

  // ProductFilters still drives category (server/URL) + price (now client-side).
  const filtersForSidebar = { ...urlFilters, min_price: priceMin, max_price: priceMax }

  const handleFilterChange = (newFilters) => {
    // Price → client-side state (no refetch)
    setPriceMin(newFilters.min_price === undefined || newFilters.min_price === null ? '' : newFilters.min_price)
    setPriceMax(newFilters.max_price === undefined || newFilters.max_price === null ? '' : newFilters.max_price)
    // Category / search → URL (triggers server refetch — unchanged behaviour)
    const params = {}
    if (newFilters.search) params.search = newFilters.search
    if (newFilters.category_id) params.category_id = newFilters.category_id
    if (newFilters.category) params.category = newFilters.category
    setSearchParams(params)
    setShowMobileFilters(false)
  }

  const clearFilters = () => {
    setSearchParams({})
    setPriceMin('')
    setPriceMax('')
    setSortBy('relevance')
    setShowMobileFilters(false)
  }

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <CategorySection categories={categories} showViewAll={false} />

        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-parchment">
                {urlFilters.search ? `Results for "${urlFilters.search}"` : 'All Products'}
              </h1>
              {!loading && <p className="text-xs text-silver-dim mt-0.5">{visibleProducts.length} product(s) found</p>}
            </div>

            <div className="flex items-center gap-2">
              {/* Custom sort dropdown — z-40 keeps it below the z-50 mobile filter overlay */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={toggleSortDropdown}
                  className="input-field !py-1.5 !w-auto text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1408] border border-gold/30 rounded-xl shadow-lg z-40 overflow-hidden divide-y divide-gold/10">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          sortBy === opt.value
                            ? 'text-gold font-semibold bg-gold/10'
                            : 'text-white/70 bg-transparent hover:bg-gold/5 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={openMobileFilters} className="lg:hidden btn-secondary !py-1.5 !px-3 text-xs">
                Filters
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-6">
            <div className="hidden lg:block">
              <ProductFilters categories={categories} filters={filtersForSidebar} onChange={handleFilterChange} onClear={clearFilters} showSort={false} />
            </div>

            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="fixed inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
                <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-surface p-4 overflow-y-auto border-r border-surface-border">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setShowMobileFilters(false)} className="text-silver-muted hover:text-parchment">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <ProductFilters categories={categories} filters={filtersForSidebar} onChange={handleFilterChange} onClear={clearFilters} sticky={false} showSort={false} />
                </div>
              </div>
            )}

            <div>
              {error && <ErrorAlert message={error} onRetry={loadProducts} />}

              {loading ? (
                <Loader fullScreen label="Loading products..." />
              ) : visibleProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-silver-muted text-lg mb-2">No products found</p>
                  <p className="text-silver-dim text-sm">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductList
