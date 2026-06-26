import axiosInstance from './axiosInstance'

export const getNotifications = () => axiosInstance.get('/notifications')
export const markAllRead = () => axiosInstance.put('/notifications/read-all')
export const markRead = (id) => axiosInstance.put(`/notifications/${id}/read`)
