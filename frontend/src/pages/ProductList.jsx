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

const PRICE_PRESETS = [
  { key: 'below500',   label: 'Below ₹500',       min: '',     max: '500' },
  { key: '500-1000',   label: '₹500 - ₹1000',     min: '500',  max: '1000' },
  { key: '1000-5000',  label: '₹1000 - ₹5000',    min: '1000', max: '5000' },
  { key: 'above5000',  label: '₹5000 and Above',   min: '5000', max: '' },
]

const LEFT_TABS = [
  { key: 'sort',     label: 'Sort' },
  { key: 'category', label: 'Category' },
  { key: 'price',    label: 'Price Range' },
]

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

  // Applied filter state
  const [sortBy, setSortBy] = useState('newest')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // Mobile 2-panel filter overlay state
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [mobileTab, setMobileTab] = useState('sort')
  const [mobileSort, setMobileSort] = useState('newest')
  const [mobileCategorySlug, setMobileCategorySlug] = useState('')
  const [mobileCategoryId, setMobileCategoryId] = useState('')
  const [mobilePricePreset, setMobilePricePreset] = useState(null)
  const [mobilePriceMin, setMobilePriceMin] = useState('')
  const [mobilePriceMax, setMobilePriceMax] = useState('')

  const urlFilters = {
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : '',
    category: searchParams.get('category') || '',
  }

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = showMobileFilter ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showMobileFilter])

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
      case 'price_asc':  list.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break
      case 'price_desc': list.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break
      case 'newest':     list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break
      case 'name_asc':   list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
      default: break
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

  // Mobile overlay handlers
  const openMobileFilter = () => {
    setMobileSort(sortBy)
    setMobileCategorySlug(urlFilters.category)
    setMobileCategoryId(urlFilters.category_id || '')
    setMobilePriceMin(priceMin)
    setMobilePriceMax(priceMax)
    const matchedPreset = PRICE_PRESETS.find((p) => p.min === String(priceMin) && p.max === String(priceMax))
    setMobilePricePreset(matchedPreset ? matchedPreset.key : null)
    setMobileTab('sort')
    setShowMobileFilter(true)
  }

  const closeMobileFilter = () => setShowMobileFilter(false)

  const applyMobileFilter = () => {
    setSortBy(mobileSort)
    setPriceMin(mobilePriceMin)
    setPriceMax(mobilePriceMax)
    const params = {}
    if (urlFilters.search) params.search = urlFilters.search
    if (mobileCategorySlug) {
      params.category = mobileCategorySlug
      if (mobileCategoryId) params.category_id = mobileCategoryId
    }
    setSearchParams(params)
    setShowMobileFilter(false)
  }

  const clearMobileFilter = () => {
    setMobileSort('newest')
    setMobileCategorySlug('')
    setMobileCategoryId('')
    setMobilePricePreset(null)
    setMobilePriceMin('')
    setMobilePriceMax('')
  }

  const handleMobilePricePreset = (preset) => {
    if (mobilePricePreset === preset.key) {
      setMobilePricePreset(null)
      setMobilePriceMin('')
      setMobilePriceMax('')
    } else {
      setMobilePricePreset(preset.key)
      setMobilePriceMin(preset.min)
      setMobilePriceMax(preset.max)
    }
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'
  const anyFilterActive = sortBy !== 'newest' || !!(urlFilters.category || urlFilters.category_id) || !!(priceMin || priceMax)

  return (
    <>
      {/* Mobile 2-panel full-screen filter overlay */}
      {showMobileFilter && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#1a1408] border-b border-gold/20">
            <span className="text-white font-bold text-base">Filters</span>
            <button onClick={closeMobileFilter} className="text-white/60 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel — 30% */}
            <div className="w-[30%] bg-[#1a1408] flex flex-col overflow-y-auto">
              {LEFT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMobileTab(tab.key)}
                  className={`py-4 px-3 text-sm text-left w-full transition-colors ${
                    mobileTab === tab.key
                      ? 'border-l-2 border-gold text-gold font-semibold bg-[#0f0d0a]'
                      : 'border-l-2 border-transparent text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right panel — 70% */}
            <div className="w-[70%] bg-[#0f0d0a] overflow-y-auto p-3">
              {/* Sort */}
              {mobileTab === 'sort' && (
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMobileSort(opt.value)}
                      className="flex items-center gap-3 w-full py-3 px-1"
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        mobileSort === opt.value ? 'border-gold' : 'border-white/30'
                      }`}>
                        {mobileSort === opt.value && (
                          <span className="w-2 h-2 rounded-full bg-gold" />
                        )}
                      </span>
                      <span className={`text-sm ${mobileSort === opt.value ? 'text-gold font-semibold' : 'text-white/70'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Category */}
              {mobileTab === 'category' && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => { setMobileCategorySlug(''); setMobileCategoryId('') }}
                    className="flex items-center gap-3 w-full py-3 px-1"
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      !mobileCategorySlug ? 'border-gold bg-gold' : 'border-white/30'
                    }`}>
                      {!mobileCategorySlug && (
                        <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm ${!mobileCategorySlug ? 'text-gold font-semibold' : 'text-white/70'}`}>
                      All Categories
                    </span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setMobileCategorySlug(cat.slug); setMobileCategoryId(cat.id) }}
                      className="flex items-center gap-3 w-full py-3 px-1"
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        mobileCategorySlug === cat.slug ? 'border-gold bg-gold' : 'border-white/30'
                      }`}>
                        {mobileCategorySlug === cat.slug && (
                          <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${mobileCategorySlug === cat.slug ? 'text-gold font-semibold' : 'text-white/70'}`}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Price Range */}
              {mobileTab === 'price' && (
                <div>
                  <div className="space-y-0.5 mb-4">
                    {PRICE_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => handleMobilePricePreset(preset)}
                        className="flex items-center gap-3 w-full py-3 px-1"
                      >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          mobilePricePreset === preset.key ? 'border-gold bg-gold' : 'border-white/30'
                        }`}>
                          {mobilePricePreset === preset.key && (
                            <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-sm ${mobilePricePreset === preset.key ? 'text-gold font-semibold' : 'text-white/70'}`}>
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-white/40 mb-2">Custom Range (₹)</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={mobilePriceMin}
                        onChange={(e) => { setMobilePriceMin(e.target.value); setMobilePricePreset(null) }}
                        className="bg-[#1a1408] border border-gold/30 rounded-lg px-2 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
                      />
                      <span className="text-white/40 flex-shrink-0">—</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={mobilePriceMax}
                        onChange={(e) => { setMobilePriceMax(e.target.value); setMobilePricePreset(null) }}
                        className="bg-[#1a1408] border border-gold/30 rounded-lg px-2 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar — always visible, fixed height 56px */}
          <div
            className="flex-shrink-0 flex items-center bg-[#0f0d0a] border-t border-gold/20 px-4 gap-3"
            style={{ height: 56 }}
          >
            <button
              onClick={clearMobileFilter}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={applyMobileFilter}
              className="ml-auto bg-gold text-black font-bold rounded-lg px-6 py-2.5 text-sm hover:brightness-110 transition-all"
            >
              Show Products
            </button>
          </div>
        </div>
      )}

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

          {/* Mobile filter trigger bar */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 bg-[#0f0d0a]/95 backdrop-blur-sm border-b border-gold/10 mb-4">
            <button
              onClick={openMobileFilter}
              className="flex items-center gap-2 text-xs text-white/70 border border-gold/20 rounded-full px-4 py-1.5 bg-[#1a1408] hover:border-gold/40 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Sort &amp; Filter
              {anyFilterActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
              )}
            </button>
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
