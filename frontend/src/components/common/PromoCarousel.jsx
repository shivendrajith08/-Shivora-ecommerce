import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  {
    id: 1,
    tag: 'Electronics Sale',
    title: 'Up to 30% Off\nGadgets & Tech',
    subtitle: 'Headphones, Smartphones & more — Limited time',
    cta: 'Shop Electronics',
    link: '/?category=electronics',
    bg: 'from-[#020818] via-[#060D22] to-[#0D1A3A]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 sm:w-32 sm:h-32 opacity-90">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
      </svg>
    ),
  },
  {
    id: 2,
    tag: 'Fashion Week',
    title: 'Fresh Styles,\nFresh Prices',
    subtitle: 'T-shirts, shoes & accessories — up to 40% off',
    cta: 'Explore Fashion',
    link: '/?category=fashion',
    bg: 'from-base via-[#201E18] to-surface-raised',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 sm:w-32 sm:h-32 opacity-90">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    id: 3,
    tag: 'Kitchen Deals',
    title: 'Cook Smarter,\nSpend Less',
    subtitle: 'Premium non-stick cookware & kitchen essentials',
    cta: 'Shop Home & Kitchen',
    link: '/?category=home-kitchen',
    bg: 'from-[#0D1610] via-[#162012] to-[#1F2D18]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 sm:w-32 sm:h-32 opacity-90">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 4,
    tag: 'Fitness Gear',
    title: 'Train Harder,\nPay Less',
    subtitle: 'Yoga mats, dumbbells & sports equipment',
    cta: 'Shop Fitness',
    link: '/?category=sports-fitness',
    bg: 'from-[#020818] via-[#060D22] to-[#0D1A3A]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 sm:w-32 sm:h-32 opacity-90">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
]

const INTERVAL = 4500
const SWIPE_THRESHOLD = 40

const PromoCarousel = () => {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, INTERVAL)
    return () => clearInterval(id)
  }, [next, paused])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      delta > 0 ? next() : prev()
    }
    touchStartX.current = null
  }

  return (
    <div
      className="relative w-full overflow-hidden touch-pan-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.id} className={`promo-slide-bg min-w-full bg-gradient-to-br ${slide.bg} text-parchment`}>
            {/* Mobile: column (text then icon). sm+: row (text | icon). */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-9 lg:py-12 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="inline-block bg-[#C0C0C0]/20 text-[#C0C0C0] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-2 sm:mb-3 uppercase tracking-widest border border-[#C0C0C0]/30">
                  {slide.tag}
                </span>
                {/* clamp: 1.4rem on narrow phones → scales with vw → caps at 2.5rem */}
                <h2
                  className="font-extrabold leading-tight mb-2 whitespace-pre-line text-parchment"
                  style={{ fontSize: 'clamp(1.4rem, 5vw, 2.5rem)' }}
                >
                  {slide.title}
                </h2>
                <p className="text-silver-muted text-xs sm:text-sm mb-4 sm:mb-5 max-w-xs sm:max-w-sm">
                  {slide.subtitle}
                </p>
                {/* Full-width on mobile, auto-width on sm+ */}
                <Link
                  to={slide.link}
                  className="flex sm:inline-flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95"
                  style={{ background: 'var(--gold-shine)', color: '#020818' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-shine-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold-shine)' }}
                >
                  {slide.cta}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Icon circle: hidden on mobile, right of text on sm+ */}
              <div className="hidden sm:flex items-center justify-center sm:w-48 sm:h-48 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0">
                {slide.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows: swipe-only on mobile, visible on sm+ */}
      <button
        onClick={prev}
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 active:bg-black/60 text-parchment items-center justify-center transition"
        aria-label="Previous slide"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={next}
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 active:bg-black/60 text-parchment items-center justify-center transition"
        aria-label="Next slide"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="px-1.5 py-3 flex items-center justify-center"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-5 bg-[#C0C0C0]' : 'w-1.5 bg-[#C0C0C0]/30 hover:bg-[#C0C0C0]/60'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromoCarousel
