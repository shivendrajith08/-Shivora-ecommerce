import React from 'react'

const COLOR_MAP = {
  blue:   'bg-blue-900/30 text-blue-300',
  green:  'bg-[#F59E0B]/15 text-[#F59E0B]',
  orange: 'bg-amber-900/30 text-amber-300',
  purple: 'bg-purple-900/30 text-purple-300',
  red:    'bg-red-900/30 text-red-400',
}

const StatCard = ({ label, value, icon, color = 'blue', suffix = '' }) => {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-silver-dim uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-extrabold text-parchment truncate">{value}{suffix}</p>
      </div>
    </div>
  )
}

export default StatCard
