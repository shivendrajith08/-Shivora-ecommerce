import React from 'react'

const Loader = ({ size = 'md', fullScreen = false, label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-[3px]',
    lg: 'h-14 w-14 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} rounded-full border-surface-border border-t-gold animate-spin`} />
      {label && <p className="text-sm text-silver-dim">{label}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center w-full">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Loader
