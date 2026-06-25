import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchProductSuggestions } from '../../api/productApi'
import { API_ORIGIN } from '../../api/axiosInstance'

const SEARCH_PLACEHOLDERS = [
  'Search sarees...',
  'Search kurtis...',
  'Search jewellery...',
  'Search electronics...',
  'Search cricket bat...',
  'Search dumbbells...',
  'Search face wash...',
  'Search hair dryer...',
  'Search books...',
  'Search toys...',
]

const SearchBar = ({ className = '', onNavigate }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const containerRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchProductSuggestions(query.trim())
        setSuggestions(res.data.suggestions || [])
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

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

  const close = () => { setOpen(false); setActiveIndex(-1) }

  const goTo = (path) => {
    close()
    setQuery('')
    navigate(path)
    onNavigate?.()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    goTo(`/products?search=${encodeURIComponent(q)}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return }
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      goTo(`/products/${suggestions[activeIndex].id}`)
    }
  }

  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0 && query.trim().length >= 2) setOpen(true) }}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            autoComplete="off"
            spellCheck="false"
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-surface-border bg-base text-parchment placeholder:text-silver-dim text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-0 top-0 h-full px-3 text-silver-dim hover:text-gold transition-colors"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-xl border border-gold/20 bg-[#1a1408] shadow-xl z-50 overflow-hidden">
          {suggestions.length === 0 ? (
            <p className="px-4 py-5 text-sm text-center text-silver-dim">
              No results for &ldquo;<span className="text-silver-muted">{query}</span>&rdquo;
            </p>
          ) : (
            <ul role="listbox">
              {suggestions.map((product, idx) => {
                const imageSrc = product.image_url
                  ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
                  : null
                const displayPrice = product.discount_price ?? product.price
                const isActive = idx === activeIndex

                return (
                  <li key={product.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); goTo(`/products/${product.id}`) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                        isActive
                          ? 'bg-gold/10 border-gold'
                          : 'border-transparent hover:bg-gold/5 hover:border-gold/30'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface border border-surface-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {imageSrc ? (
                          <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-parchment truncate leading-snug">{product.name}</p>
                        <p className="text-xs text-silver-dim mt-0.5 leading-snug truncate">
                          {product.category_name || `₹${displayPrice.toLocaleString('en-IN')}`}
                        </p>
                      </div>

                      <svg className="w-4 h-4 text-silver-dim flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </li>
                )
              })}

              <li className="px-4 py-2.5 border-t border-surface-border">
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); goTo(`/products?search=${encodeURIComponent(query.trim())}`) }}
                  className="text-xs text-gold hover:underline transition-colors"
                >
                  See all results for &ldquo;<span className="font-semibold">{query}</span>&rdquo; →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
