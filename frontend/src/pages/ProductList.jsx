import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import SEO from '../components/SEO'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../api/productApi'
import { getCategories } from '../api/categoryApi'
import ProductCard from '../components/product/ProductCard'
import ProductFilters from '../components/product/ProductFilters'
import CategorySection from '../components/common/CategorySection'
import ProductSkeleton from '../components/common/ProductSkeleton'
import ErrorAlert from '../components/common/ErrorAlert'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const effectivePrice = (p) => (p.discount_price != null ? p.discount_price : p.price)

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  // Desktop sort dropdown
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef(null)

  // Applied filter state
  const [sortBy, setSortBy] = useState('newest')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState('Sort')
  const [tempSort, setTempSort] = useState('newest')
  const [tempCategory, setTempCategory] = useState('')
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')

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
    setPage(1)
    try {
      const params = { ...urlFilters, per_page: 12, page: 1 }
      Object.keys(params).forEach((k) => (params[k] === '' && delete params[k]))
      const res = await getProducts(params)
      setProducts(res.data.products)
      setHasMore((res.data.page ?? 1) < (res.data.pages ?? 1))
    } catch (err) {
      setError('Could not load products. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const params = {}
      const search = searchParams.get('search') || ''
      const categoryId = searchParams.get('category_id')
      const category = searchParams.get('category') || ''
      if (search) params.search = search
      if (categoryId) params.category_id = Number(categoryId)
      if (category) params.category = category
      params.per_page = 12
      params.page = nextPage
      const res = await getProducts(params)
      setProducts((prev) => [...prev, ...res.data.products])
      setPage(nextPage)
      setHasMore((res.data.page ?? nextPage) < (res.data.pages ?? nextPage))
    } catch {
      // silent – Load More failure shouldn't break the page
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, searchParams])

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

  // Initialize temp state from current applied values before opening the sheet
  const openMobileFilter = () => {
    setTempSort(sortBy)
    setTempCategory(urlFilters.category || '')
    setTempMin(priceMin)
    setTempMax(priceMax)
    setActiveFilterTab('Sort')
    setShowMobileFilter(true)
  }

  const handleApplyFilters = () => {
    setSortBy(tempSort)
    setPriceMin(tempMin)
    setPriceMax(tempMax)
    // Preserve existing URL params (search, category_id) — only update category from temp
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (tempCategory) {
        next.set('category', tempCategory)
        next.delete('category_id')
      }
      return next
    })
    setShowMobileFilter(false)
  }

  const handleClearFilters = () => {
    setTempSort('newest')
    setTempCategory('')
    setTempMin('')
    setTempMax('')
    setSortBy('newest')
    setPriceMin('')
    setPriceMax('')
    setSearchParams({})
    setShowMobileFilter(false)
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'
  const anyFilterActive = sortBy !== 'newest' || !!(urlFilters.category || urlFilters.category_id) || !!(priceMin || priceMax)

  return (
    <>
      <SEO title="All Products" description="Browse premium fashion, electronics, home & more at Shivora." url="/products" />
      {showMobileFilter && (
        <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',flexDirection:'column',background:'#020818'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderBottom:'1px solid rgba(245,158,11,0.2)',flexShrink:0}}>
            <button onClick={() => setShowMobileFilter(false)} style={{color:'#F4F4F2',background:'none',border:'none',fontSize:'20px'}}>←</button>
            <span style={{color:'#F4F4F2',fontWeight:'bold',fontSize:'16px'}}>Filters</span>
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
            <div className="hidden lg:flex items-center gap-2">
              <span style={{color:'rgba(255,255,255,0.6)', fontSize:'14px', marginRight:'8px'}}>Sort By</span>
              <div className="relative" ref={sortRef}>
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
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          sortBy === opt.value
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
          </div>

          {/* Mobile filter trigger bar */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 bg-[#020818]/95 backdrop-blur-sm border-b border-[#F59E0B]/10 mb-4">
            <button
              onClick={openMobileFilter}
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

          <div className="flex gap-6 items-start">
            {/* Sidebar: hidden on mobile, shown on lg+ */}
            <div className="hidden lg:block w-[260px] flex-shrink-0 sticky top-24">
              <ProductFilters
                categories={categories}
                filters={filtersForSidebar}
                onChange={handleFilterChange}
                onClear={clearFilters}
                showSort={false}
              />
            </div>

            <div className="w-full min-w-0">
              {error && <ErrorAlert message={error} onRetry={loadProducts} />}

              {loading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-silver-muted text-lg mb-2">No products found</p>
                  <p className="text-silver-dim text-sm">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4">
                    {visibleProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-8 mb-4">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="btn-primary !px-10 !py-3 text-sm disabled:opacity-60"
                      >
                        {loadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductList
