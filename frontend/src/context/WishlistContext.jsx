import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getWishlist, addToWishlist as apiAdd, removeFromWishlistByProduct } from '../api/wishlistApi'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) { setWishlist([]); return }
    try {
      setLoading(true)
      const res = await getWishlist()
      setWishlist(res.data.wishlist || [])
    } catch {
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const isWishlisted = (productId) => wishlist.some(item => item.product_id === productId)

  const toggleWishlist = async (productId) => {
    if (isWishlisted(productId)) {
      setWishlist(prev => prev.filter(item => item.product_id !== productId))
      try { await removeFromWishlistByProduct(productId) }
      catch { fetchWishlist() }
    } else {
      setWishlist(prev => [...prev, { product_id: productId }])
      try { await apiAdd(productId) }
      catch { fetchWishlist() }
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlist, loading, isWishlisted, toggleWishlist, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
