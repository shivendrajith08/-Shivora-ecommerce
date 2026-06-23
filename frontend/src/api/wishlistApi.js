import axiosInstance from './axiosInstance'

export const getWishlist = () => axiosInstance.get('/wishlist')

export const addToWishlist = (productId) =>
  axiosInstance.post('/wishlist', { product_id: productId })

export const removeFromWishlist = (wishlistId) => axiosInstance.delete(`/wishlist/${wishlistId}`)

export const removeFromWishlistByProduct = (productId) =>
  axiosInstance.delete(`/wishlist/product/${productId}`)
