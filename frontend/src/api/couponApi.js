import axiosInstance from './axiosInstance'

// Public (logged-in): validate a code against the current order total
export const validateCoupon = (code, orderTotal) =>
  axiosInstance.post('/coupons/validate', { code, order_total: orderTotal })

// Admin
export const getCoupons = () => axiosInstance.get('/admin/coupons')
export const createCoupon = (data) => axiosInstance.post('/admin/coupons', data)
export const updateCoupon = (id, data) => axiosInstance.put(`/admin/coupons/${id}`, data)
export const deleteCoupon = (id) => axiosInstance.delete(`/admin/coupons/${id}`)
