import React, { useState, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc',  label: 'Name: A to Z' },
]

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={
      active
        ? 'bg-gold text-black font-semibold rounded-full px-3 py-1.5 text-xs'
        : 'border border-white/20 text-white/70 rounded-full px-3 py-1.5 text-xs hover:border-gold/40 transition-colors'
    }
  >
    {label}
  </button>
)

const ProductFilters = ({
  categories = [],
  filters = {},
  onChange,
  onClear,
  onApply,
  sticky = true,
  showSort = true,
}) => {
  const [sort, setSort]         = useState(filters.sort       || 'newest')
  const [category, setCategory] = useState(filters.category   || '')
  const [minPrice, setMinPrice] = useState(filters.min_price  || '')
  const [maxPrice, setMaxPrice] = useState(filters.max_price  || '')

  useEffect(() => {
    setSort(filters.sort       || 'newest')
    setCategory(filters.category   || '')
    setMinPrice(filters.min_price  || '')
    setMaxPrice(filters.max_price  || '')
  }, [filters.sort, filters.category, filters.min_price, filters.max_price])

  const apply = () => {
    onChange({ ...filters, sort, category, category_id: '', min_price: minPrice, max_price: maxPrice, page: 1 })
    onApply?.()
  }

  const reset = () => {
    setSort('newest'); setCategory(''); setMinPrice(''); setMaxPrice('')
    onChange({ ...filters, sort: 'newest', category: '', category_id: '', min_price: '', max_price: '', page: 1 })
    onClear?.()
  }

  return (
    <div className="bg-[#020818] border border-gold/20 rounded-xl flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-gold/10">
        <h3 className="font-bold text-gold">Filters</h3>
      </div>

      <div className="px-4 pb-4">
        <div className="border-t border-gold/10 pt-4 mt-4">
          <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                active={category === cat.slug}
                onClick={() => setCategory(category === cat.slug ? '' : cat.slug)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gold/10 pt-4 mt-4">
          <p className="text-xs font-bold text-gold/70 uppercase tracking-wider mb-3">Price Range (₹)</p>
          <div className="flex flex-col gap-2">
            <input
              type="number" min="0" placeholder="Min" value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="bg-[#060D22] border border-gold/30 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
            <input
              type="number" min="0" placeholder="Max" value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-[#060D22] border border-gold/30 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-gold/60"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gold/20 flex gap-3">
        <button
          onClick={reset}
          className="border border-white/20 text-white/70 rounded-full py-2.5 flex-1 text-sm hover:bg-white/5 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={apply}
          className="bg-gold text-black font-bold rounded-full py-2.5 flex-1 text-sm hover:brightness-110 transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
