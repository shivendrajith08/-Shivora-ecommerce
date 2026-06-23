import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '../api/cartApi'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([])
      setCartTotal(0)
      setCartCount(0)
      return
    }
    setLoading(true)
    try {
      const res = await getCart()
      setCartItems(res.data.cart)
      setCartTotal(res.data.total)
      setCartCount(res.data.item_count)
    } catch (err) {
      // silent fail, cart stays as-is
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = async (productId, quantity = 1) => {
    try {
      await apiAddToCart(productId, quantity)
      await refreshCart()
      toast.success('Added to cart')
      return true
    } catch (err) {
      const message = err.response?.data?.message || 'Could not add to cart'
      toast.error(message)
      return false
    }
  }

  const updateItem = async (cartId, quantity) => {
    try {
      await apiUpdateCartItem(cartId, quantity)
      await refreshCart()
      return true
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update cart'
      toast.error(message)
      return false
    }
  }

  const removeItem = async (cartId) => {
    try {
      await apiRemoveFromCart(cartId)
      await refreshCart()
      toast.success('Item removed')
      return true
    } catch (err) {
      toast.error('Could not remove item')
      return false
    }
  }

  const clearCartItems = async () => {
    try {
      await apiClearCart()
      setCartItems([])
      setCartTotal(0)
      setCartCount(0)
      return true
    } catch (err) {
      return false
    }
  }

  const value = {
    cartItems,
    cartTotal,
    cartCount,
    loading,
    addItem,
    updateItem,
    removeItem,
    clearCartItems,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
