import axiosInstance from './axiosInstance'

export const checkout = (shippingData) => axiosInstance.post('/orders/checkout', shippingData)

// Buy Now: single-product instant checkout that never touches the cart
export const buyNowCheckout = (productId, quantity, shippingData) =>
  axiosInstance.post('/orders/buy-now', { product_id: productId, quantity, ...shippingData })

export const getOrderHistory = () => axiosInstance.get('/orders')

export const getOrderDetail = (orderId) => axiosInstance.get(`/orders/${orderId}`)

export const cancelOrder = (orderId) => axiosInstance.put(`/orders/${orderId}/cancel`)
