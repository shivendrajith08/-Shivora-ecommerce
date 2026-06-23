import axiosInstance from './axiosInstance'

export const registerUser = (data) => axiosInstance.post('/auth/register', data)

export const loginUser = (data) => axiosInstance.post('/auth/login', data)

export const getCurrentUser = () => axiosInstance.get('/auth/me')

// Demo-only password reset (no email verification) — see backend route comment.
export const resetPassword = (data) => axiosInstance.post('/auth/reset-password', data)
