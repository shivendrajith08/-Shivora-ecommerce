import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-extrabold text-gold mb-2">404</p>
      <h1 className="text-2xl font-bold text-parchment mb-2">Page not found</h1>
      <p className="text-silver-muted mb-8 max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="btn-primary !px-6">Back to Home</Link>
    </div>
  )
}

export default NotFound
