import axiosInstance from './axiosInstance'

// User
export const createReturn = (orderId, data) => axiosInstance.post(`/orders/${orderId}/return`, data)
export const getReturn = (orderId) => axiosInstance.get(`/orders/${orderId}/return`)

// Admin
export const getReturns = () => axiosInstance.get('/admin/returns')
export const approveReturn = (id, data) => axiosInstance.put(`/admin/returns/${id}/approve`, data)
export const rejectReturn = (id, data) => axiosInstance.put(`/admin/returns/${id}/reject`, data)
