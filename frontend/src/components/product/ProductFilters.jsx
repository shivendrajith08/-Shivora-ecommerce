import React from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const ProductFilters = ({ categories, filters, onChange, onClear, onApply, sticky = true, showSort = true }) => {
  const handleCategoryClick = (cat) => {
    const nextSlug = filters.category === cat.slug ? '' : cat.slug
    onChange({ ...filters, category: nextSlug, category_id: '', min_price: '', max_price: '', page: 1 })
  }

  const handlePriceChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 })
  }

  const handleSortChange = (value) => {
    onChange({ ...filters, sort: value, page: 1 })
  }

  return (
    <div className={`bg-[#0f0d0a] border border-gold/20 rounded-xl flex flex-col ${sticky ? 'sticky top-20' : ''}`}>
      {/* Scrollable content */}
      <div className="overflow-y-auto max-h-[70vh] p-4">
        <h3 className="font-bold text-gold mb-4">Filters</h3>

        {showSort && (
          <>
            <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-2">Sort By</p>
            {SORT_OPTIONS.map((opt) => {
              const selected = (filters.sort || 'newest') === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className="w-full text-left flex items-center gap-2 py-3 px-2 border-b border-gold/10"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      selected ? 'bg-gold' : 'bg-transparent'
                    }`}
                  />
                  <span className={`text-sm ${selected ? 'text-gold font-semibold' : 'text-white/70'}`}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
            <div className="border-t border-gold/10 my-4" />
          </>
        )}

        <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-2">Categories</p>
        {categories.map((cat) => {
          const selected = filters.category === cat.slug
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="w-full text-left flex items-center gap-2 py-3 px-2 border-b border-gold/10"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  selected ? 'bg-gold' : 'bg-transparent'
                }`}
              />
              <span className={`text-sm ${selected ? 'text-gold font-semibold' : 'text-white/70'}`}>
                {cat.name}
              </span>
            </button>
          )
        })}

        <div className="border-t border-gold/10 my-4" />

        <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Price Range (₹)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handlePriceChange('min_price', e.target.value)}
            className="bg-[#1a1408] border border-gold/30 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
          />
          <span className="text-white/50 flex-shrink-0">—</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handlePriceChange('max_price', e.target.value)}
            className="bg-[#1a1408] border border-gold/30 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
          />
        </div>
      </div>

      {/* Sticky bottom buttons */}
      <div className="flex gap-3 p-4 bg-[#0f0d0a] border-t border-gold/20 rounded-b-xl">
        <button
          onClick={onClear}
          className="border border-gold/30 text-white/70 rounded-xl py-2.5 flex-1 text-sm hover:bg-white/5 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="bg-gold text-black font-bold rounded-xl py-2.5 flex-1 text-sm hover:brightness-110 transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
