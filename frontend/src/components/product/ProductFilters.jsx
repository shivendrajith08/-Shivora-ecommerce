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
    <div className={`bg-[#1a1408] border border-gold/20 rounded-xl flex flex-col ${sticky ? 'sticky top-20' : ''}`}>
      {/* Scrollable content */}
      <div className="overflow-y-auto max-h-[70vh] p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gold">Filters</h3>
        </div>

        {showSort && (
          <div>
            <label className="label-text">Sort By</label>
            <div className="bg-[#1a1408] border border-gold/20 rounded-xl overflow-hidden divide-y divide-gold/10 mt-1.5">
              {SORT_OPTIONS.map((opt) => {
                const selected = (filters.sort || 'newest') === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer ${selected ? 'bg-gold/10' : ''}`}
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={selected}
                      onChange={() => handleSortChange(opt.value)}
                      className="hidden"
                    />
                    <span className={`text-sm ${selected ? 'text-gold font-semibold' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        selected ? 'border-gold bg-gold' : 'border-white/30'
                      }`}
                    />
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-silver-muted mb-2">Categories</h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className={`w-full text-left px-2 py-3 min-h-[44px] rounded-lg text-sm transition ${
                  filters.category === cat.slug
                    ? 'bg-gold/10 text-gold font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-parchment'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-silver-muted mb-2">Price Range (₹)</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filters.min_price || ''}
              onChange={(e) => handlePriceChange('min_price', e.target.value)}
              className="bg-[#1a1408] border border-gold/30 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
            <span className="text-silver-dim flex-shrink-0">—</span>
            <input
              type="number"
              min="0"
              placeholder="99999"
              value={filters.max_price || ''}
              onChange={(e) => handlePriceChange('max_price', e.target.value)}
              className="bg-[#1a1408] border border-gold/30 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
          </div>
        </div>
      </div>

      {/* Sticky Apply / Reset buttons */}
      <div className="flex gap-3 p-4 border-t border-gold/10">
        <button
          onClick={onClear}
          className="border border-gold/30 text-white rounded-xl py-2 flex-1 text-sm hover:bg-white/5 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="bg-gold text-black font-semibold rounded-xl py-2 flex-1 text-sm hover:brightness-110 transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
