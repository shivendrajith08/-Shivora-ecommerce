import React from 'react'

// Flipkart-style horizontal stepper for an order's progress.
// Frontend-only: derived entirely from the existing order `status` value.
const STAGES = ['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered']

// How far along the stepper a given status has progressed.
// `reached` = index of the active stage; everything before it is complete.
// There is no real "Out for Delivery" status, so it only fills on Delivered.
const STATUS_TO_REACHED = {
  pending: 0,            // not yet confirmed → highlight "Confirmed"
  processing: 0,         // "Confirmed"
  shipped: 1,
  out_for_delivery: 2,   // supported if the backend ever adds it
  delivered: 3,
}

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const OrderTimeline = ({ status }) => {
  // ── Special case: Cancelled — no stepper, red banner instead ──────────────
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3">
        <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-red-400">Order Cancelled</p>
          <p className="text-xs text-red-400/70">This order was cancelled and will not be delivered.</p>
        </div>
      </div>
    )
  }

  const delivered = status === 'delivered'
  const reached = STATUS_TO_REACHED[status] ?? 0

  const stageState = (i) => {
    if (delivered) return 'complete'
    if (i < reached) return 'complete'
    if (i === reached) return 'current'
    return 'upcoming'
  }

  return (
    <div className="flex items-start">
      {STAGES.map((label, i) => {
        const st = stageState(i)
        // the connector AFTER stage i is gold once we've moved past stage i
        const lineComplete = delivered || i < reached
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center flex-shrink-0 w-14 sm:w-24">
              <div
                className={[
                  'flex items-center justify-center rounded-full w-7 h-7 sm:w-8 sm:h-8 text-[11px] sm:text-xs font-bold transition-colors',
                  st === 'complete' ? 'bg-gold text-[#14130F]' : '',
                  st === 'current' ? 'bg-surface text-gold ring-2 ring-gold animate-pulse' : '',
                  st === 'upcoming' ? 'bg-surface border border-surface-border text-silver-dim' : '',
                ].join(' ')}
              >
                {st === 'complete' ? <CheckIcon /> : i + 1}
              </div>
              <span
                className={[
                  'mt-2 text-center text-[10px] sm:text-xs leading-tight',
                  st === 'upcoming' ? 'text-silver-dim' : 'text-parchment',
                  st === 'current' ? 'font-semibold text-gold' : '',
                ].join(' ')}
              >
                {label}
              </span>
            </div>

            {i < STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mt-3.5 sm:mt-4 rounded ${lineComplete ? 'bg-gold' : 'bg-surface-border'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default OrderTimeline
