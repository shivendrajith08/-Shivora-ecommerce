import React, { useEffect, useState, useCallback, useRef } from 'react'
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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

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
      className="flex-shrink-0 w-36 bg-surface rounded-xl overflow-hidden border border-surface-border hover:border-[#F59E0B]/40 transition-all"
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
        <p className="text-xs font-bold text-[#FCD34D]">₹{price.toLocaleString('en-IN')}</p>
      </div>
    </Link>
  )
}


const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const [trendingProducts, setTrendingProducts] = useState([])
  const [dealProducts, setDealProducts] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])

  // 2-panel filter state
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState('Sort')
  const [tempSort, setTempSort] = useState('newest')
  const [tempCategory, setTempCategory] = useState('')
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')

  // Desktop sort dropdown
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef(null)

  const trendingRef = useRef(null)
  const trendingInterval = useRef(null)
  const dealsRef = useRef(null)
  const dealsInterval = useRef(null)

  const startScroll = (ref, intervalRef) => {
    intervalRef.current = setInterval(() => {
      if (ref.current) {
        ref.current.scrollLeft += 1
        if (ref.current.scrollLeft >= ref.current.scrollWidth / 2) {
          ref.current.scrollLeft = 0
        }
      }
    }, 20)
  }

  const stopScroll = (intervalRef) => {
    clearInterval(intervalRef.current)
  }

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

  useEffect(() => {
    if (trendingProducts.length === 0) return
    startScroll(trendingRef, trendingInterval)
    return () => stopScroll(trendingInterval)
  }, [trendingProducts])

  useEffect(() => {
    if (dealProducts.length === 0) return
    startScroll(dealsRef, dealsInterval)
    return () => stopScroll(dealsInterval)
  }, [dealProducts])

  // Lock body scroll when 2-panel filter is open
  useEffect(() => {
    document.body.style.overflow = showMobileFilter ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showMobileFilter])

  // Close desktop sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSortDropdown])

  const updateFilters = (newFilters) => {
    const params = {}
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v
    })
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})
  const goToPage = (page) => updateFilters({ ...filters, page })

  const handleApplyFilters = () => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (tempCategory) params.category = tempCategory
    if (tempMin) params.min_price = tempMin
    if (tempMax) params.max_price = tempMax
    if (tempSort !== 'newest') params.sort = tempSort
    setSearchParams(params)
    setShowMobileFilter(false)
  }

  const handleClearFilters = () => {
    setTempSort('newest')
    setTempCategory('')
    setTempMin('')
    setTempMax('')
    setSearchParams({})
    setShowMobileFilter(false)
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (filters.sort || 'newest'))?.label ?? 'Sort'
  const anyFilterActive = (filters.sort && filters.sort !== 'newest') || !!(filters.category || filters.category_id) || !!(filters.min_price || filters.max_price)

  const activeCategory = categories.find((c) => c.slug === filters.category)
  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : activeCategory
      ? activeCategory.name
      : 'All Products'

  const showHomeSections = !filters.category && !filters.search

  return (
    <>
      {showMobileFilter && (
        <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',flexDirection:'column',background:'#020818'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderBottom:'1px solid rgba(245,158,11,0.2)',flexShrink:0}}>
            <button onClick={() => setShowMobileFilter(false)} style={{color:'white',background:'none',border:'none',fontSize:'20px'}}>←</button>
            <span style={{color:'white',fontWeight:'bold',fontSize:'16px'}}>Filters</span>
            <button onClick={handleClearFilters} style={{color:'#F59E0B',background:'none',border:'none',fontSize:'13px'}}>Clear All</button>
          </div>

          {/* Body */}
          <div style={{display:'flex',flex:1,overflow:'hidden'}}>

            {/* Left tabs */}
            <div style={{width:'110px',background:'#060D22',overflowY:'auto',flexShrink:0}}>
              {['Sort','Category','Price'].map(tab => (
                <div key={tab} onClick={() => setActiveFilterTab(tab)}
                  style={{padding:'16px 12px',fontSize:'13px',cursor:'pointer',borderLeft: activeFilterTab===tab ? '3px solid #F59E0B' : '3px solid transparent',color: activeFilterTab===tab ? '#F59E0B' : 'rgba(255,255,255,0.6)',fontWeight: activeFilterTab===tab ? '600' : '400',background: activeFilterTab===tab ? '#020818' : 'transparent'}}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Right content */}
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>

              {activeFilterTab === 'Sort' && (
                <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                  {[{v:'newest',l:'Newest First'},{v:'price_asc',l:'Price: Low to High'},{v:'price_desc',l:'Price: High to Low'},{v:'name_asc',l:'Name: A to Z'}].map(opt => (
                    <div key={opt.v} onClick={() => setTempSort(opt.v)}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempSort===opt.v ? 'rgba(245,158,11,0.1)' : 'transparent'}}>
                      <span style={{color: tempSort===opt.v ? '#F59E0B' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{opt.l}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempSort===opt.v ? '5px solid #F59E0B' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                </div>
              )}

              {activeFilterTab === 'Category' && (
                <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                  {categories.map(cat => (
                    <div key={cat.id} onClick={() => setTempCategory(tempCategory===cat.slug ? '' : cat.slug)}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempCategory===cat.slug ? 'rgba(245,158,11,0.1)' : 'transparent'}}>
                      <span style={{color: tempCategory===cat.slug ? '#F59E0B' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{cat.name}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempCategory===cat.slug ? '5px solid #F59E0B' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                </div>
              )}

              {activeFilterTab === 'Price' && (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[{l:'Below ₹500',min:'',max:'500'},{l:'₹500 - ₹1,000',min:'500',max:'1000'},{l:'₹1,000 - ₹5,000',min:'1000',max:'5000'},{l:'₹5,000 and Above',min:'5000',max:''}].map(range => (
                    <div key={range.l} onClick={() => { setTempMin(range.min); setTempMax(range.max) }}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempMin===range.min && tempMax===range.max ? 'rgba(245,158,11,0.1)' : 'transparent'}}>
                      <span style={{color: tempMin===range.min && tempMax===range.max ? '#F59E0B' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{range.l}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempMin===range.min && tempMax===range.max ? '5px solid #F59E0B' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                  <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <label style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:'500'}}>Min Price</label>
                      <input type="number" placeholder="Min" value={tempMin} onChange={e=>setTempMin(e.target.value)} style={{width:'100%',background:'#060D22',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px',padding:'10px',color:'white',fontSize:'14px'}}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <label style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:'500'}}>Max Price</label>
                      <input type="number" placeholder="Max" value={tempMax} onChange={e=>setTempMax(e.target.value)} style={{width:'100%',background:'#060D22',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'10px',padding:'10px',color:'white',fontSize:'14px'}}/>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom bar */}
          <div style={{display:'flex',gap:'12px',padding:'12px 16px',borderTop:'1px solid rgba(245,158,11,0.2)',paddingBottom:'70px',flexShrink:0,background:'#020818'}}>
            <button onClick={handleClearFilters} style={{flex:1,border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.7)',borderRadius:'999px',padding:'12px',fontSize:'14px',background:'transparent'}}>Clear All</button>
            <button onClick={handleApplyFilters} style={{flex:2,background:'#F59E0B',color:'black',fontWeight:'bold',borderRadius:'999px',padding:'12px',fontSize:'14px',border:'none'}}>Show Products</button>
          </div>

        </div>
      )}

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
            {trendingProducts.length > 0 && (
              <div className="mb-2">
                <h2 className="text-base font-bold text-white mb-2">Trending Now</h2>
                <div
                  ref={trendingRef}
                  onMouseEnter={() => stopScroll(trendingInterval)}
                  onMouseLeave={() => startScroll(trendingRef, trendingInterval)}
                  onTouchStart={() => stopScroll(trendingInterval)}
                  onTouchEnd={() => startScroll(trendingRef, trendingInterval)}
                  style={{display:'flex', gap:'16px', overflowX:'auto', scrollbarWidth:'none', cursor:'grab'}}
                >
                  {[...trendingProducts, ...trendingProducts].map((product, i) => (
                    <HScrollCard key={i} product={product} />
                  ))}
                </div>
              </div>
            )}
            {dealProducts.length > 0 && (
              <div className="mb-2">
                <h2 className="text-base font-bold text-white mb-2">Best Deals</h2>
                <div
                  ref={dealsRef}
                  onMouseEnter={() => stopScroll(dealsInterval)}
                  onMouseLeave={() => startScroll(dealsRef, dealsInterval)}
                  onTouchStart={() => stopScroll(dealsInterval)}
                  onTouchEnd={() => startScroll(dealsRef, dealsInterval)}
                  style={{display:'flex', gap:'16px', overflowX:'auto', scrollbarWidth:'none', cursor:'grab'}}
                >
                  {[...dealProducts, ...dealProducts].map((product, i) => (
                    <HScrollCard key={i} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          {/* ── Heading row ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-parchment">{pageTitle}</h1>
              {!loading && (
                <p className="text-xs text-silver-dim mt-0.5">{pagination.total} product(s) found</p>
              )}
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
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#060D22] border border-[#F59E0B]/30 rounded-xl shadow-lg z-40 overflow-hidden divide-y divide-[#F59E0B]/10">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { updateFilters({ ...filters, sort: opt.value, page: 1 }); setShowSortDropdown(false) }}
                      className={`w-full text-left px-3 py-2 text-sm transition ${
                        filters.sort === opt.value
                          ? 'text-[#F59E0B] font-semibold bg-[#F59E0B]/10'
                          : 'text-white/70 bg-transparent hover:bg-[#F59E0B]/5 hover:text-white'
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
          <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 bg-[#020818]/95 backdrop-blur-sm border-b border-[#F59E0B]/10 mb-4">
            <button
              onClick={() => setShowMobileFilter(true)}
              className="flex items-center gap-2 text-xs text-white/70 border border-[#F59E0B]/20 rounded-full px-4 py-1.5 bg-[#060D22] hover:border-[#F59E0B]/40 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Sort &amp; Filter
              {anyFilterActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
              )}
            </button>
          </div>

          {/* ── Desktop sidebar + product grid ──────────────────────────────── */}
          <div className="grid lg:grid-cols-[260px_1fr] gap-6">

            {/* Desktop sidebar — always visible on lg+ */}
            <div className="hidden lg:block sticky top-20 h-fit self-start">
              <ProductFilters
                categories={categories}
                filters={filters}
                onChange={updateFilters}
                onClear={clearFilters}
              />
            </div>

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
          <div className="w-full mb-2" style={{width:'100%'}}>
            <h2 className="text-base font-bold text-white mb-2">Recently Viewed</h2>
            <div className="flex overflow-x-auto gap-4 pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {recentlyViewed.map(p => {
                const img = p.image_url
                  ? (p.image_url.startsWith('http') ? p.image_url : `${API_ORIGIN}${p.image_url}`)
                  : null
                const price = p.discount_price && p.discount_price < p.price ? p.discount_price : p.price
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="w-36 flex-shrink-0">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-28 object-cover rounded-lg" loading="lazy" />
                    ) : (
                      <div className="w-full h-28 bg-surface-raised rounded-lg flex items-center justify-center text-silver-dim">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-xs text-white/80 truncate mt-1">{p.name}</p>
                    <p className="text-xs text-[#FCD34D]">₹{price.toLocaleString('en-IN')}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <section className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-surface-border">
          {TRUST_BADGES.map((item) => (
            <div key={item.title} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center flex-shrink-0">
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
