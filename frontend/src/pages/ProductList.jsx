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
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const Checkmark = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const effectivePrice = (p) => (p.discount_price != null ? p.discount_price : p.price)

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Desktop sort dropdown
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef(null)

  // Mobile chip bar
  const [openChip, setOpenChip] = useState(null) // 'sort' | 'category' | 'price' | null
  const [tempPriceMin, setTempPriceMin] = useState('')
  const [tempPriceMax, setTempPriceMax] = useState('')
  const chipBarRef = useRef(null)

  const [sortBy, setSortBy] = useState('newest')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

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

  // Close desktop sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSortDropdown])

  // Close mobile chip dropdown on outside click
  useEffect(() => {
    if (!openChip) return
    const handler = (e) => {
      if (chipBarRef.current && !chipBarRef.current.contains(e.target)) setOpenChip(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openChip])

  const toggleChip = (chip) => {
    if (openChip === chip) {
      setOpenChip(null)
    } else {
      if (chip === 'price') {
        setTempPriceMin(priceMin)
        setTempPriceMax(priceMax)
      }
      setOpenChip(chip)
    }
  }

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
      case 'name_asc':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
      default:
        break
    }
    return list
  }, [products, priceMin, priceMax, sortBy])

  const filtersForSidebar = { ...urlFilters, min_price: priceMin, max_price: priceMax }

  const handleFilterChange = (newFilters) => {
    setPriceMin(newFilters.min_price === undefined || newFilters.min_price === null ? '' : newFilters.min_price)
    setPriceMax(newFilters.max_price === undefined || newFilters.max_price === null ? '' : newFilters.max_price)
    const params = {}
    if (newFilters.search) params.search = newFilters.search
    if (newFilters.category_id) params.category_id = newFilters.category_id
    if (newFilters.category) params.category = newFilters.category
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
    setPriceMin('')
    setPriceMax('')
    setSortBy('newest')
  }

  // Mobile chip handlers
  const handleMobileSort = (value) => {
    setSortBy(value)
    setOpenChip(null)
  }

  const handleMobileCategory = (cat) => {
    const params = {}
    if (urlFilters.search) params.search = urlFilters.search
    if (cat) {
      params.category_id = cat.id
      params.category = cat.slug
    }
    setSearchParams(params)
    setOpenChip(null)
  }

  const applyMobilePrice = () => {
    setPriceMin(tempPriceMin)
    setPriceMax(tempPriceMax)
    setOpenChip(null)
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'
  const currentCategoryLabel = urlFilters.category
    ? (categories.find((c) => c.slug === urlFilters.category)?.name ?? 'Category')
    : 'All Categories'
  const priceLabel = (priceMin || priceMax) ? `₹${priceMin || '0'}-${priceMax || '∞'}` : 'Price'

  const sortActive = sortBy !== 'newest'
  const categoryActive = !!(urlFilters.category || urlFilters.category_id)
  const priceActive = !!(priceMin || priceMax)

  const chipDefault = 'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer bg-[#1a1408] border border-gold/20 text-white/70 transition-colors'
  const chipActiveCls = 'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer bg-gold border border-gold text-black font-semibold'

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

            {/* Desktop-only sort dropdown */}
            <div className="hidden lg:block relative" ref={sortRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="input-field !py-1.5 !w-auto text-sm flex items-center gap-1.5 cursor-pointer"
              >
                {currentSortLabel}
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
          </div>

          {/* Mobile horizontal filter chip bar */}
          <div
            ref={chipBarRef}
            className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 bg-[#0f0d0a]/95 backdrop-blur-sm border-b border-gold/10 mb-4"
          >
            <div
              className="flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Sort chip */}
              <div className="relative flex-shrink-0">
                <button onClick={() => toggleChip('sort')} className={sortActive ? chipActiveCls : chipDefault}>
                  {currentSortLabel}
                  <svg
                    className={`w-3 h-3 transition-transform ${openChip === 'sort' ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openChip === 'sort' && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-[#1a1408] border border-gold/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleMobileSort(opt.value)}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition ${
                          sortBy === opt.value ? 'text-gold' : 'text-white/70 hover:text-white hover:bg-gold/5'
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && <Checkmark />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category chip */}
              <div className="relative flex-shrink-0">
                <button onClick={() => toggleChip('category')} className={categoryActive ? chipActiveCls : chipDefault}>
                  {currentCategoryLabel}
                  <svg
                    className={`w-3 h-3 transition-transform ${openChip === 'category' ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openChip === 'category' && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-[#1a1408] border border-gold/20 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    <button
                      onClick={() => handleMobileCategory(null)}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition ${
                        !urlFilters.category ? 'text-gold' : 'text-white/70 hover:text-white hover:bg-gold/5'
                      }`}
                    >
                      All Categories
                      {!urlFilters.category && <Checkmark />}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleMobileCategory(cat)}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition ${
                          urlFilters.category === cat.slug ? 'text-gold' : 'text-white/70 hover:text-white hover:bg-gold/5'
                        }`}
                      >
                        {cat.name}
                        {urlFilters.category === cat.slug && <Checkmark />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price chip */}
              <div className="relative flex-shrink-0">
                <button onClick={() => toggleChip('price')} className={priceActive ? chipActiveCls : chipDefault}>
                  {priceLabel}
                  <svg
                    className={`w-3 h-3 transition-transform ${openChip === 'price' ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openChip === 'price' && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-[#1a1408] border border-gold/20 rounded-xl shadow-xl z-50 p-3">
                    <p className="text-xs text-gold/70 font-semibold uppercase tracking-wider mb-2">Price Range (₹)</p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={tempPriceMin}
                        onChange={(e) => setTempPriceMin(e.target.value)}
                        className="bg-[#0f0d0a] border border-gold/30 rounded-lg px-2 py-1.5 text-white text-xs w-full focus:outline-none focus:border-gold/60"
                      />
                      <span className="text-white/40 flex-shrink-0">—</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={tempPriceMax}
                        onChange={(e) => setTempPriceMax(e.target.value)}
                        className="bg-[#0f0d0a] border border-gold/30 rounded-lg px-2 py-1.5 text-white text-xs w-full focus:outline-none focus:border-gold/60"
                      />
                    </div>
                    <button
                      onClick={applyMobilePrice}
                      className="w-full bg-gold text-black font-bold rounded-full py-1.5 text-xs hover:brightness-110 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-6">
            <div className="hidden lg:block">
              <ProductFilters
                categories={categories}
                filters={filtersForSidebar}
                onChange={handleFilterChange}
                onClear={clearFilters}
                showSort={false}
              />
            </div>

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
