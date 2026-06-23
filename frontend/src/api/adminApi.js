import axiosInstance from './axiosInstance'

export const getDashboardStats = () => axiosInstance.get('/admin/dashboard')

export const adminGetOrders = (params = {}) => axiosInstance.get('/orders/admin/all', { params })

export const adminGetOrderDetail = (orderId) => axiosInstance.get(`/orders/admin/${orderId}`)

export const adminUpdateOrderStatus = (orderId, status) =>
  axiosInstance.put(`/orders/admin/${orderId}/status`, { status })

export const adminGetUsers = (params = {}) => axiosInstance.get('/admin/users', { params })

export const adminGetUserDetail = (userId) => axiosInstance.get(`/admin/users/${userId}`)

export const adminToggleUserStatus = (userId) =>
  axiosInstance.put(`/admin/users/${userId}/toggle-status`)

export const adminGetReviews = () => axiosInstance.get('/admin/reviews')

export const adminDeleteReview = (reviewId) => axiosInstance.delete(`/admin/reviews/${reviewId}`)
