import axiosInstance from './axiosInstance'

export const getCart = () => axiosInstance.get('/cart')

export const addToCart = (productId, quantity = 1) =>
  axiosInstance.post('/cart', { product_id: productId, quantity })

export const updateCartItem = (cartId, quantity) =>
  axiosInstance.put(`/cart/${cartId}`, { quantity })

export const removeFromCart = (cartId) => axiosInstance.delete(`/cart/${cartId}`)

export const clearCart = () => axiosInstance.delete('/cart/clear')
