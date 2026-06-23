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
    bg: 'from-[#10131A] via-[#1A2030] to-[#243050]',
    icon: (
      <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15.75h3" />
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
      <svg className="w-14 h-14 sm:w-16 sm:h-16 text-silver/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
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
      <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
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
    bg: 'from-[#1A1208] via-[#2A1E08] to-gold-deep',
    icon: (
      <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
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
          <div key={slide.id} className={`min-w-full bg-gradient-to-br ${slide.bg} text-parchment`}>
            {/* Mobile: column (text then icon). sm+: row (text | icon). */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-9 lg:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-gold/20 text-gold text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-2 sm:mb-3 uppercase tracking-widest border border-gold/30">
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
                  style={{ background: 'var(--gold-shine)', color: '#14130F' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-shine-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold-shine)' }}
                >
                  {slide.cta}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Icon circle: below text on mobile (self-center), right of text on sm+ */}
              <div className="self-center flex items-center justify-center flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-gold/5 border border-gold/10 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-full bg-gold/10 flex items-center justify-center">
                    {slide.icon}
                  </div>
                </div>
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
                i === current ? 'w-5 bg-gold' : 'w-1.5 bg-gold/30 hover:bg-gold/60'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromoCarousel
