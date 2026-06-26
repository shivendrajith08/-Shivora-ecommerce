import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { getCategories } from '../../api/categoryApi'

const ICONS = {
  electronics: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15.75h3" />
    </svg>
  ),
  fashion: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  'home-kitchen': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  books: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  'sports-fitness': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
}

const ALL_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const DEFAULT_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3m-6 4.5h9M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
)

const CategoryBar = () => {
  const [categories, setCategories] = useState([])
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const activeSlug = searchParams.get('category') || ''
  const isHomeActive = location.pathname === '/' && !activeSlug

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch(() => {})
  }, [])

  if (categories.length === 0) return null

  return (
    <div className="bg-surface border-b border-surface-border">
      <div
        className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center overflow-x-auto py-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 flex-shrink-0 transition-colors group ${
            isHomeActive ? 'text-[#F59E0B]' : 'text-silver-muted hover:text-[#F59E0B]'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isHomeActive ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-surface-raised text-silver-muted group-hover:bg-[#F59E0B]/10 group-hover:text-[#F59E0B]'
          }`}>
            {ALL_ICON}
          </div>
          <span className="text-[10px] font-bold whitespace-nowrap">Home</span>
          {isHomeActive && <span className="w-4 h-0.5 rounded-full bg-[#F59E0B] mt-0.5" />}
        </Link>

        <span className="h-8 w-px bg-surface-border mx-1 flex-shrink-0" />

        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug
          return (
            <Link
              key={cat.id}
              to={`/?category=${cat.slug}`}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 flex-shrink-0 transition-colors group ${
                isActive ? 'text-[#F59E0B]' : 'text-silver-muted hover:text-[#F59E0B]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-surface-raised text-silver-muted group-hover:bg-[#F59E0B]/10 group-hover:text-[#F59E0B]'
              }`}>
                {ICONS[cat.slug] || DEFAULT_ICON}
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
              {isActive && <span className="w-4 h-0.5 rounded-full bg-[#F59E0B] mt-0.5" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryBar
