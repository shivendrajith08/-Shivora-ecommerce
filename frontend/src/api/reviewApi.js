import axiosInstance from './axiosInstance'

export const getProductReviews = (productId) => axiosInstance.get(`/reviews/product/${productId}`)

export const createReview = ({ product_id, rating, comment, image }) => {
  if (image) {
    const fd = new FormData()
    fd.append('product_id', product_id)
    fd.append('rating', rating)
    if (comment) fd.append('comment', comment)
    fd.append('image', image)
    return axiosInstance.post('/reviews', fd, { headers: { 'Content-Type': undefined } })
  }
  return axiosInstance.post('/reviews', { product_id, rating, comment })
}
