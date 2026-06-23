import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { adminGetReviews, adminDeleteReview } from '../../api/adminApi'
import { API_ORIGIN } from '../../api/axiosInstance'
import Loader from '../../components/common/Loader'
import ErrorAlert from '../../components/common/ErrorAlert'

const Stars = ({ rating }) => (
  <span className="text-sm tracking-tight">
    <span className="text-amber-400">{'★'.repeat(rating)}</span>
    <span className="text-silver-dim">{'★'.repeat(5 - rating)}</span>
  </span>
)

const ManageReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminGetReviews()
      setReviews(res.data.reviews)
    } catch {
      setError('Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return
    setDeletingId(reviewId)
    try {
      await adminDeleteReview(reviewId)
      toast.success('Review deleted')
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete review')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-parchment">Reviews</h1>
        <p className="text-silver-dim text-sm mt-1">{reviews.length} review(s) total</p>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadReviews} />}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader label="Loading reviews..." />
        ) : reviews.length === 0 ? (
          <p className="text-center text-silver-dim py-16">No reviews yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised">
                <tr className="text-left text-xs text-silver-dim uppercase">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Reviewer</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Comment</th>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-t border-surface-border hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-parchment max-w-[140px]">
                      <span className="block truncate" title={review.product_name}>
                        {review.product_name || `#${review.product_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-silver-muted whitespace-nowrap">{review.reviewer_name || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><Stars rating={review.rating} /></td>
                    <td className="px-4 py-3 text-silver-muted max-w-[220px]">
                      {review.comment ? (
                        <span className="line-clamp-2" title={review.comment}>{review.comment}</span>
                      ) : (
                        <span className="text-silver-dim italic text-xs">No comment</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {review.photo_url ? (
                        <img src={`${API_ORIGIN}${review.photo_url}`} alt="Review photo" className="w-10 h-10 object-cover rounded-lg border border-surface-border" />
                      ) : (
                        <span className="text-silver-dim text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-silver-dim text-xs whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(review.id)} disabled={deletingId === review.id} className="text-xs font-semibold text-red-400 hover:underline disabled:opacity-40">
                        {deletingId === review.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageReviews
