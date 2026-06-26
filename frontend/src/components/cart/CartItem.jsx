import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { API_ORIGIN } from '../../api/axiosInstance'

const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useCart()
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)

  const product = item.product
  if (!product) return null

  const imageSrc = product.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `${API_ORIGIN}${product.image_url}`)
    : null

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1 || newQty > product.stock) return
    setUpdating(true)
    await updateItem(item.id, newQty)
    setUpdating(false)
  }

  const handleRemove = async () => {
    setRemoving(true)
    await removeItem(item.id)
  }

  return (
    <div className="flex gap-4 p-4 border-b border-surface-border last:border-0">
      <Link to={`/products/${product.id}`} className="w-20 h-20 bg-surface-raised rounded-lg overflow-hidden flex-shrink-0">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-silver-dim">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159M3 11.25V19.5a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 19.5V11.25" />
            </svg>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/products/${product.id}`} className="text-sm font-semibold text-parchment hover:text-[#F59E0B] line-clamp-1">
          {product.name}
        </Link>
        <p className="text-sm text-silver-dim mt-1">
          ₹{(product.discount_price || product.price).toLocaleString('en-IN')} each
        </p>

        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          <div className="flex items-center border border-surface-border rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-silver-muted disabled:opacity-40 hover:text-parchment transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-parchment">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating || item.quantity >= product.stock}
              className="w-9 h-9 flex items-center justify-center text-silver-muted disabled:opacity-40 hover:text-parchment transition-colors"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-parchment text-sm">₹{item.subtotal?.toLocaleString('en-IN')}</span>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="p-2 -m-2 text-red-500 hover:text-red-400"
              title="Remove item"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
        {item.quantity >= product.stock && (
          <p className="text-xs text-amber-400 mt-1">Max available stock reached</p>
        )}
      </div>
    </div>
  )
}

export default CartItem
