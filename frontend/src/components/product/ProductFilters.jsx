import React, { useState, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const Chip = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={
      selected
        ? 'bg-gold text-black font-semibold rounded-full px-3 py-1.5 text-xs'
        : 'border border-white/20 text-white/70 rounded-full px-3 py-1.5 text-xs hover:border-gold/40 transition-colors'
    }
  >
    {label}
  </button>
)

const ProductFilters = ({ categories, filters, onChange, onClear, onApply, sticky = true, showSort = true }) => {
  const [localSort, setLocalSort] = useState(filters.sort || 'newest')
  const [localCategory, setLocalCategory] = useState(filters.category || '')
  const [localMinPrice, setLocalMinPrice] = useState(filters.min_price || '')
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price || '')

  // Sync local state when parent filters change (e.g. external reset)
  useEffect(() => {
    setLocalSort(filters.sort || 'newest')
    setLocalCategory(filters.category || '')
    setLocalMinPrice(filters.min_price || '')
    setLocalMaxPrice(filters.max_price || '')
  }, [filters.sort, filters.category, filters.min_price, filters.max_price])

  const handleApply = () => {
    onChange({
      ...filters,
      sort: localSort,
      category: localCategory,
      category_id: '',
      min_price: localMinPrice,
      max_price: localMaxPrice,
      page: 1,
    })
    if (onApply) onApply()
  }

  const handleReset = () => {
    setLocalSort('newest')
    setLocalCategory('')
    setLocalMinPrice('')
    setLocalMaxPrice('')
    onChange({ ...filters, sort: 'newest', category: '', category_id: '', min_price: '', max_price: '', page: 1 })
    if (onClear) onClear()
  }

  return (
    <div className={`bg-[#0f0d0a] border border-gold/20 rounded-xl flex flex-col h-full ${sticky ? 'sticky top-20' : ''}`}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h3 className="font-bold text-gold mb-4">Filters</h3>

        {showSort && (
          <div className="border-t border-gold/10 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
            <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Sort By</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={localSort === opt.value}
                  onClick={() => setLocalSort(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gold/10 pt-4 mt-4">
          <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={localCategory === cat.slug}
                onClick={() => setLocalCategory(localCategory === cat.slug ? '' : cat.slug)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gold/10 pt-4 mt-4">
          <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Price Range (₹)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="bg-[#1a1408] border border-gold/30 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
            <span className="text-white/50 flex-shrink-0">—</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="bg-[#1a1408] border border-gold/30 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
          </div>
        </div>
      </div>

      {/* Always-visible bottom buttons */}
      <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gold/20">
        <button
          onClick={handleReset}
          className="border border-white/20 text-white/70 rounded-full py-2.5 flex-1 text-sm hover:bg-white/5 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="bg-gold text-black font-bold rounded-full py-2.5 flex-1 text-sm hover:brightness-110 transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
