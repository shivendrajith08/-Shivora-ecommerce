import React from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const ProductFilters = ({ categories, filters, onChange, onClear, sticky = true, showSort = true }) => {
  // Category selection uses the URL `category` slug (same param as the navbar strip)
  // so navbar + sidebar are always in sync. Replaces the slug, clears category_id, resets price.
  const handleCategoryClick = (cat) => {
    const nextSlug = filters.category === cat.slug ? '' : cat.slug
    onChange({ ...filters, category: nextSlug, category_id: '', min_price: '', max_price: '', page: 1 })
  }

  const handlePriceChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 })
  }

  const handleSortChange = (e) => {
    onChange({ ...filters, sort: e.target.value, page: 1 })
  }

  return (
    <div className={`card p-4 space-y-6 ${sticky ? 'sticky top-20' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gold">Filters</h3>
        <button onClick={onClear} className="text-xs text-gold font-medium hover:underline">
          Clear all
        </button>
      </div>

      {showSort && (
        <div>
          <label className="label-text">Sort By</label>
          <select value={filters.sort || 'newest'} onChange={handleSortChange} className="input-field">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-silver-muted mb-2">Categories</h4>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition ${
                filters.category === cat.slug
                  ? 'bg-gold/10 text-gold font-semibold border border-gold/30'
                  : 'text-silver-muted hover:bg-surface-raised hover:text-parchment'
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
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => handlePriceChange('min_price', e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
          <span className="text-silver-dim">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => handlePriceChange('max_price', e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default ProductFilters
