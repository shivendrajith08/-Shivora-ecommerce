import React from 'react'

const PageLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020818] z-50">
    <div className="w-10 h-10 rounded-full border-4 border-[#F59E0B] border-t-transparent animate-spin mb-4" />
    <span className="text-sm text-[#94A3B8]">Loading...</span>
  </div>
)

export default PageLoader
