import React from 'react'

const ProductSkeleton = () => (
  <div className="card overflow-hidden flex flex-col h-full rounded-xl animate-pulse">
    <div className="aspect-square bg-[#0A1535]" />
    <div className="px-2 pt-2 pb-3 flex flex-col gap-2">
      <div className="h-2.5 bg-[#0A1535] rounded w-1/3" />
      <div className="h-3 bg-[#0A1535] rounded w-full" />
      <div className="h-3 bg-[#0A1535] rounded w-4/5" />
      <div className="h-4 bg-[#0A1535] rounded w-1/2 mt-1" />
      <div className="h-9 bg-[#0A1535] rounded-full mt-2" />
    </div>
  </div>
)

export default ProductSkeleton
