import React from 'react'
import { Link } from 'react-router-dom'

const CATEGORY_ICONS = {
  electronics:     'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13.5h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  fashion:         'M3 7.5L7 4h10l4 3.5-3 3-1.5-1.5V20h-9V9l-1.5 1.5-3-3z',
  'home-kitchen':  'M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z',
  books:           'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  'sports-fitness':'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375',
}
const DEFAULT_ICON = 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5'

const CategorySection = ({ categories = [], showViewAll = true }) => {
  if (!categories.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-parchment uppercase tracking-wide">Shop by Category</h2>
        {showViewAll && (
          <Link to="/" className="text-xs font-semibold text-gold hover:underline">View all</Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/?category=${cat.slug}`}
            className="card p-3 flex flex-col items-center text-center gap-2 hover:border-gold/50 hover:-translate-y-0.5 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 text-gold group-hover:bg-gold/20 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={CATEGORY_ICONS[cat.slug] || DEFAULT_ICON} />
              </svg>
            </div>
            <span className="text-xs font-semibold text-silver-muted group-hover:text-parchment leading-tight transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategorySection
