import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance, { API_ORIGIN } from '../../api/axiosInstance'

const SEARCH_PLACEHOLDERS = [
  'Search sarees...',
  'Search kurtis...',
  'Search jewellery...',
  'Search home decor...',
  'Search ethnic wear...',
  'Search handbags...',
  'Search face wash...',
  'Search hair dryer...',
  'Search products...',
  'Search accessories...',
]

const SearchBar = ({ className = '', onNavigate }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shivora_searches') || '[]') } catch { return [] }
  })
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.get('/products/search/suggestions', { params: { q: query.trim() } })
        setSuggestions(res.data.suggestions || [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  const close = () => { setOpen(false); setActiveIndex(-1) }

  const saveSearch = (term) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('shivora_searches', JSON.stringify(updated))
  }

  const goTo = (path) => {
    close()
    setQuery('')
    navigate(path)
    onNavigate?.()
  }

  const handleSearch = (term) => {
    const t = (term ?? query).trim()
    if (!t) return
    saveSearch(t)
    goTo(`/products?search=${encodeURIComponent(t)}`)
  }

  const handleProductClick = (product) => {
    goTo(`/products/${product.id}`)
  }

  const clearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem('shivora_searches')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleProductClick(suggestions[activeIndex])
    }
  }

  const showRecent = open && query.trim().length === 0 && recentSearches.length > 0
  const showSuggestions = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch() }} className="w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            autoComplete="off"
            spellCheck="false"
            className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-surface-border bg-base text-parchment placeholder:text-silver-dim text-sm focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 transition"
          />
          <div className="absolute right-0 top-0 h-full flex items-center gap-0.5 pr-2">
            {loading && (
              <svg className="w-4 h-4 animate-spin text-[#F59E0B] flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {query && !loading && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
                className="p-1 text-[#475569] hover:text-[#F4F4F2] transition-colors"
                aria-label="Clear"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className="px-1 text-silver-dim hover:text-[#F59E0B] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {(showRecent || showSuggestions) && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-xl border border-[#F59E0B]/20 bg-[#060D22] shadow-xl z-50 overflow-hidden">

          {showRecent && (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-xs text-[#475569] font-medium uppercase tracking-wide">Recent searches</span>
                <button onClick={clearRecent} className="text-xs text-[#F59E0B] hover:underline">Clear</button>
              </div>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); handleSearch(s) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F59E0B]/5 cursor-pointer transition-colors text-left border-l-2 border-transparent hover:border-[#F59E0B]/30"
                >
                  <svg className="w-3.5 h-3.5 text-[#475569] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-[#94A3B8]">{s}</span>
                </button>
              ))}
            </>
          )}

          {showSuggestions && (
            <ul role="listbox">
              {suggestions.length === 0 && !loading ? (
                <p className="px-4 py-5 text-sm text-center text-silver-dim">
                  No results for &ldquo;<span className="text-silver-muted">{query}</span>&rdquo;
                </p>
              ) : (
                <>
                  {suggestions.map((product, idx) => {
                    const imageSrc = product.image
                      ? (product.image.startsWith('http') ? product.image : `${API_ORIGIN}${product.image}`)
                      : null
                    const isActive = idx === activeIndex
                    return (
                      <li key={product.id} role="option" aria-selected={isActive}>
                        <button
                          type="button"
                          onPointerDown={(e) => { e.preventDefault(); handleProductClick(product) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                            isActive
                              ? 'bg-[#F59E0B]/10 border-[#F59E0B]'
                              : 'border-transparent hover:bg-[#F59E0B]/5 hover:border-[#F59E0B]/30'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-surface border border-surface-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {imageSrc ? (
                              <img src={imageSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <svg className="w-5 h-5 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-parchment truncate leading-snug">{product.name}</p>
                            <p className="text-xs text-silver-dim mt-0.5 truncate">
                              {product.category || `₹${product.price.toLocaleString('en-IN')}`}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[#FCD34D] flex-shrink-0">
                            ₹{product.price.toLocaleString('en-IN')}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                  {suggestions.length > 0 && (
                    <li className="px-4 py-2.5 border-t border-surface-border">
                      <button
                        type="button"
                        onPointerDown={(e) => { e.preventDefault(); handleSearch() }}
                        className="text-xs text-[#F59E0B] hover:underline transition-colors"
                      >
                        See all results for &ldquo;<span className="font-semibold">{query}</span>&rdquo; →
                      </button>
                    </li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
