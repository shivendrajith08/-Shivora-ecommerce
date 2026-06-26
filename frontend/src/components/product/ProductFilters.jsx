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
        ? 'bg-[#F59E0B] text-[#020818] font-semibold rounded-full px-3 py-1.5 text-xs'
        : 'border border-[#F59E0B]/30 text-[#F59E0B]/70 rounded-full px-3 py-1.5 text-xs hover:border-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors'
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
    <div className="bg-[#060D22] border border-[rgba(245,158,11,0.15)] rounded-xl flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-[rgba(245,158,11,0.1)]">
        <h3 className="font-bold text-[#F59E0B]">Filters</h3>
      </div>

      <div className="px-4 pb-4">
        <div className="border-t border-[rgba(245,158,11,0.1)] pt-4 mt-4">
          <p className="text-xs font-bold text-[#F59E0B]/70 uppercase tracking-wider mb-3">Category</p>
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

        <div className="border-t border-[rgba(245,158,11,0.1)] pt-4 mt-4">
          <p className="text-xs font-bold text-[#F59E0B]/70 uppercase tracking-wider mb-3">Price Range (₹)</p>
          <div className="flex flex-col gap-2">
            <input
              type="number" min="0" placeholder="Min" value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="bg-[#0A1535] border border-[rgba(245,158,11,0.3)] rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/20"
            />
            <input
              type="number" min="0" placeholder="Max" value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-[#0A1535] border border-[rgba(245,158,11,0.3)] rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-[#F59E0B]/60 focus:ring-1 focus:ring-[#F59E0B]/20"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[rgba(245,158,11,0.15)] flex gap-3">
        <button
          onClick={reset}
          className="border border-[rgba(245,158,11,0.3)] text-[#F59E0B]/70 rounded-full py-2.5 flex-1 text-sm hover:bg-[rgba(245,158,11,0.08)] transition-colors"
        >
          Reset
        </button>
        <button
          onClick={apply}
          className="bg-[#F59E0B] text-[#020818] font-bold rounded-full py-2.5 flex-1 text-sm hover:bg-[#D97706] transition-all"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export default ProductFilters
