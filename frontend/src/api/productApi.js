import axiosInstance from './axiosInstance'

export const getProducts = (params = {}) => axiosInstance.get('/products', { params })

export const searchProductSuggestions = (q) => axiosInstance.get('/products/search', { params: { q } })

export const getProductById = (id) => axiosInstance.get(`/products/${id}`)

export const getProductBySlug = (slug) => axiosInstance.get(`/products/slug/${slug}`)

// Admin
export const adminGetProducts = (params = {}) => axiosInstance.get('/products/admin/all', { params })

export const createProduct = (formData) =>
  axiosInstance.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateProduct = (id, formData) =>
  axiosInstance.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`)
