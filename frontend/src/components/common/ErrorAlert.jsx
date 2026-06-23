import React from 'react'

const ErrorAlert = ({ message, onRetry }) => {
  if (!message) return null

  return (
    <div className="bg-red-900/20 border border-red-800/50 text-red-400 rounded-lg px-4 py-3 flex items-start justify-between gap-3 text-sm">
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline whitespace-nowrap">
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorAlert
