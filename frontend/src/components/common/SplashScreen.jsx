import React, { useState, useEffect } from 'react'

const G0 = '#E8E8E8'
const G1 = '#C0C0C0'
const G2 = '#A0A0A0'
const GOLD = `linear-gradient(to bottom, ${G0} 0%, ${G1} 50%, ${G2} 100%)`

const VERTICES = [[0, -38], [22, -12], [13, 32], [-13, 32], [-22, -12]]

const SESSION_KEY = 'shivora_splash_v1'

// Module-level IIFE — runs once on module load, outside React's render cycle,
// so React 18 StrictMode double-invocation cannot corrupt the sessionStorage flag.
// DEV mode always returns true so a hard-refresh re-triggers the splash.
export const shouldShow = (() => {
  if (typeof window === 'undefined') return false
  if (import.meta.env.DEV) return true
  if (sessionStorage.getItem(SESSION_KEY)) return false
  sessionStorage.setItem(SESSION_KEY, '1')
  return true
})()

// ── Animation timeline ────────────────────────────────────────────────────────
//  0.05s          polygon stroke begins drawing       (1.20s draw)  → done 1.25s
//  0.20–0.80s     7 facet lines draw, staggered       (0.65–0.70s)  → done ≤ 1.45s
//  0.85–1.09s     5 vertex dots fade in, staggered    (0.30s each)  → done ≤ 1.39s
//  0.90s          italic S fades in                   (0.50s)       → done 1.40s
//  1.30s          SHIVORA letters rise in, staggered  (0.40s each, 0.067s gap)
//                 → last letter (i=6) done at 1.702 + 0.40 = 2.10s
//  2.10–3.10s     hold — full logo visible             (1.00s)
//  3.10s          overlay fades out                   (0.80s)       → done 3.90s
//  4.00s          component unmounts (100ms buffer)
// Total ≈ 3.8–4.0s

const SplashScreen = () => {
  const [visible, setVisible] = useState(shouldShow)

  useEffect(() => {
    if (!visible) return
    if (!import.meta.env.DEV) sessionStorage.setItem(SESSION_KEY, '1')
    const t = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        backgroundColor: '#020818',
        // hold 1s, then fade 0.8s starting at 3.1s
        animation: 'sp-exit 0.8s ease-in 3.1s forwards',
      }}
    >
      {/* ── Gem mark (78 × 120 px) ── */}
      <svg width="78" height="120" viewBox="-24 -40 48 74" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="splashGold"
            x1="0" y1="-40" x2="0" y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor={G0} />
            <stop offset="50%"  stopColor={G1} />
            <stop offset="100%" stopColor={G2} />
          </linearGradient>
        </defs>

        {/* Outer polygon — 1.2s draw */}
        <polygon
          pathLength="1"
          points="0,-38 22,-12 13,32 -13,32 -22,-12"
          stroke="url(#splashGold)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeDasharray="1"
          style={{ animation: 'sp-draw 1.2s ease-out 0.05s both' }}
        />

        {/* Top facets — staggered within the polygon draw window */}
        <line pathLength="1" x1="0"   y1="-38" x2="22"  y2="-12"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.70s ease-out 0.20s both' }} />
        <line pathLength="1" x1="0"   y1="-38" x2="-22" y2="-12"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.70s ease-out 0.30s both' }} />
        <line pathLength="1" x1="-22" y1="-12" x2="22"  y2="-12"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.70s ease-out 0.40s both' }} />

        {/* Bottom facets */}
        <line pathLength="1" x1="22"  y1="-12" x2="0" y2="0"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.65s ease-out 0.50s both' }} />
        <line pathLength="1" x1="-22" y1="-12" x2="0" y2="0"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.65s ease-out 0.60s both' }} />
        <line pathLength="1" x1="13"  y1="32"  x2="0" y2="0"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.65s ease-out 0.70s both' }} />
        <line pathLength="1" x1="-13" y1="32"  x2="0" y2="0"
              stroke="url(#splashGold)" strokeWidth="0.6" opacity="0.6"
              strokeDasharray="1"
              style={{ animation: 'sp-draw 0.65s ease-out 0.80s both' }} />

        {/* Vertex dots — staggered 0.06s apart, starting at 0.85s */}
        {VERTICES.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.5"
                  fill="url(#splashGold)"
                  style={{ animation: `sp-fade-in 0.30s ease-out ${0.85 + i * 0.06}s both` }} />
        ))}

        {/* Italic S — fades in while polygon is still drawing */}
        <text
          x="0" y="10"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="38"
          fontStyle="italic"
          fill="url(#splashGold)"
          style={{ animation: 'sp-fade-in 0.50s ease-out 0.90s both' }}
        >
          S
        </text>
      </svg>

      {/* ── SHIVORA wordmark — 7 letters, each 0.40s, stagger 0.067s ── */}
      {/* First letter at 1.30s, last at 1.702s → all done at 2.10s (0.8s span) */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        {'SHIVORA'.split('').map((letter, i, arr) => (
          <span
            key={i}
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '22px',
              display: 'inline-block',
              marginRight: i < arr.length - 1 ? '5px' : 0,
              background: GOLD,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: `sp-letter-in 0.40s ease-out ${(1.30 + i * 0.067).toFixed(3)}s both`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}

export default SplashScreen
