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

  const handleApplyFilters = () => {
    setSortBy(tempSort)
    setPriceMin(tempMin)
    setPriceMax(tempMax)
    const params = {}
    if (urlFilters.search) params.search = urlFilters.search
    if (tempCategory) params.category = tempCategory
    setSearchParams(params)
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
      {showMobileFilter && (
        <div style={{position:'fixed',inset:0,zIndex:100,display:'flex',flexDirection:'column',background:'#0f0d0a'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderBottom:'1px solid rgba(212,175,55,0.2)',flexShrink:0}}>
            <button onClick={() => setShowMobileFilter(false)} style={{color:'white',background:'none',border:'none',fontSize:'20px'}}>←</button>
            <span style={{color:'white',fontWeight:'bold',fontSize:'16px'}}>Filters</span>
            <button onClick={handleClearFilters} style={{color:'#D4AF37',background:'none',border:'none',fontSize:'13px'}}>Clear All</button>
          </div>

          {/* Body */}
          <div style={{display:'flex',flex:1,overflow:'hidden'}}>

            {/* Left tabs */}
            <div style={{width:'110px',background:'#1a1408',overflowY:'auto',flexShrink:0}}>
              {['Sort','Category','Price'].map(tab => (
                <div key={tab} onClick={() => setActiveFilterTab(tab)}
                  style={{padding:'16px 12px',fontSize:'13px',cursor:'pointer',borderLeft: activeFilterTab===tab ? '3px solid #D4AF37' : '3px solid transparent',color: activeFilterTab===tab ? '#D4AF37' : 'rgba(255,255,255,0.6)',fontWeight: activeFilterTab===tab ? '600' : '400',background: activeFilterTab===tab ? '#0f0d0a' : 'transparent'}}>
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
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempSort===opt.v ? 'rgba(212,175,55,0.1)' : 'transparent'}}>
                      <span style={{color: tempSort===opt.v ? '#D4AF37' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{opt.l}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempSort===opt.v ? '5px solid #D4AF37' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                </div>
              )}

              {activeFilterTab === 'Category' && (
                <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                  {categories.map(cat => (
                    <div key={cat.id} onClick={() => setTempCategory(tempCategory===cat.slug ? '' : cat.slug)}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempCategory===cat.slug ? 'rgba(212,175,55,0.1)' : 'transparent'}}>
                      <span style={{color: tempCategory===cat.slug ? '#D4AF37' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{cat.name}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempCategory===cat.slug ? '5px solid #D4AF37' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                </div>
              )}

              {activeFilterTab === 'Price' && (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[{l:'Below ₹500',min:'',max:'500'},{l:'₹500 - ₹1,000',min:'500',max:'1000'},{l:'₹1,000 - ₹5,000',min:'1000',max:'5000'},{l:'₹5,000 and Above',min:'5000',max:''}].map(range => (
                    <div key={range.l} onClick={() => { setTempMin(range.min); setTempMax(range.max) }}
                      style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 12px',borderRadius:'8px',cursor:'pointer',background: tempMin===range.min && tempMax===range.max ? 'rgba(212,175,55,0.1)' : 'transparent'}}>
                      <span style={{color: tempMin===range.min && tempMax===range.max ? '#D4AF37' : 'rgba(255,255,255,0.7)',fontSize:'13px'}}>{range.l}</span>
                      <div style={{width:'18px',height:'18px',borderRadius:'50%',border: tempMin===range.min && tempMax===range.max ? '5px solid #D4AF37' : '2px solid rgba(255,255,255,0.3)'}}></div>
                    </div>
                  ))}
                  <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <label style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:'500'}}>Min Price</label>
                      <input type="number" placeholder="Min" value={tempMin} onChange={e=>setTempMin(e.target.value)} style={{width:'100%',background:'#1a1408',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'10px',padding:'10px',color:'white',fontSize:'14px'}}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      <label style={{color:'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:'500'}}>Max Price</label>
                      <input type="number" placeholder="Max" value={tempMax} onChange={e=>setTempMax(e.target.value)} style={{width:'100%',background:'#1a1408',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'10px',padding:'10px',color:'white',fontSize:'14px'}}/>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom bar */}
          <div style={{display:'flex',gap:'12px',padding:'12px 16px',borderTop:'1px solid rgba(212,175,55,0.2)',paddingBottom:'70px',flexShrink:0,background:'#0f0d0a'}}>
            <button onClick={handleClearFilters} style={{flex:1,border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.7)',borderRadius:'999px',padding:'12px',fontSize:'14px',background:'transparent'}}>Clear All</button>
            <button onClick={handleApplyFilters} style={{flex:2,background:'#D4AF37',color:'black',fontWeight:'bold',borderRadius:'999px',padding:'12px',fontSize:'14px',border:'none'}}>Show Products</button>
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
              onClick={() => setShowMobileFilter(true)}
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
            <div className="hidden lg:block sticky top-20 h-fit">
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
