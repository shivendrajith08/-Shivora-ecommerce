import axiosInstance from './axiosInstance'

export const getCategories = (withCount = false) =>
  axiosInstance.get('/categories', { params: { with_count: withCount } })

export const getCategoryById = (id) => axiosInstance.get(`/categories/${id}`)

// Admin
export const createCategory = (data) => axiosInstance.post('/categories', data)

export const updateCategory = (id, data) => axiosInstance.put(`/categories/${id}`, data)

export const deleteCategory = (id) => axiosInstance.delete(`/categories/${id}`)
