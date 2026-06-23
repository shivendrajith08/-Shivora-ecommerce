import axiosInstance from './axiosInstance'

export const getAddresses = () => axiosInstance.get('/addresses')
export const createAddress = (data) => axiosInstance.post('/addresses', data)
export const updateAddress = (id, data) => axiosInstance.put(`/addresses/${id}`, data)
export const deleteAddress = (id) => axiosInstance.delete(`/addresses/${id}`)
export const setDefaultAddress = (id) => axiosInstance.put(`/addresses/${id}/set-default`)
