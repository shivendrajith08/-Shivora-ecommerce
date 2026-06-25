import React from 'react'
import { Link } from 'react-router-dom'

// Shared gold gradient stop colours (light → mid → dark)
const G0 = '#F5E4A8'
const G1 = '#C0C0C0'
const G2 = '#808080'

const GOLD_CSS = `linear-gradient(to bottom, ${G0} 0%, ${G1} 50%, ${G2} 100%)`

/**
 * Gem-facet mark + "SHIVORA" wordmark.
 * Gem polygon vertices: top(0,-38), upper-right(22,-12), lower-right(13,32),
 * lower-left(-13,32), upper-left(-22,-12). Facets converge at (0,0).
 * Total rendered height ≈ 44 px — fits the h-16 navbar with comfortable padding.
 */
const Logo = ({ className = '' }) => (
  <Link
    to="/"
    className={`flex items-center gap-3 flex-shrink-0 select-none ${className}`}
    aria-label="Shivora — home"
  >
    {/* ── Gem mark ── */}
    <svg
      width="29"
      height="44"
      viewBox="-24 -40 48 74"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/*
          userSpaceOnUse so every element — polygon, lines, circles, text —
          shares one consistent top-to-bottom gold gradient across the whole gem.
          y1=-40 and y2=34 match the viewBox extents.
        */}
        <linearGradient
          id="shivoraGold"
          x1="0" y1="-40"
          x2="0" y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor={G0} />
          <stop offset="50%"  stopColor={G1} />
          <stop offset="100%" stopColor={G2} />
        </linearGradient>
      </defs>

      {/* Outer gem polygon — strokeWidth 1.8 per spec */}
      <polygon
        points="0,-38 22,-12 13,32 -13,32 -22,-12"
        stroke="url(#shivoraGold)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Top facets: top point → each upper corner + horizontal across upper corners */}
      <line x1="0"   y1="-38" x2="22"  y2="-12" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />
      <line x1="0"   y1="-38" x2="-22" y2="-12" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />
      <line x1="-22" y1="-12" x2="22"  y2="-12" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />

      {/* Bottom facets: upper corners → center (0,0), lower corners → center */}
      <line x1="22"  y1="-12" x2="0" y2="0" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />
      <line x1="-22" y1="-12" x2="0" y2="0" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />
      <line x1="13"  y1="32"  x2="0" y2="0" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />
      <line x1="-13" y1="32"  x2="0" y2="0" stroke="url(#shivoraGold)" strokeWidth="0.6" opacity="0.6" />

      {/* r=1.5 filled circles at each of the 5 vertices */}
      <circle cx="0"   cy="-38" r="1.5" fill="url(#shivoraGold)" />
      <circle cx="22"  cy="-12" r="1.5" fill="url(#shivoraGold)" />
      <circle cx="13"  cy="32"  r="1.5" fill="url(#shivoraGold)" />
      <circle cx="-13" cy="32"  r="1.5" fill="url(#shivoraGold)" />
      <circle cx="-22" cy="-12" r="1.5" fill="url(#shivoraGold)" />

      {/*
        Italic "S" — fontSize 38 SVG units → ~22 px rendered.
        y="10" places the baseline so the visual centre of the glyph
        sits at ≈ (0, −3), which is the geometric centre of the bounding box.
        textAnchor="middle" + x="0" horizontally centres it.
      */}
      <text
        x="0"
        y="10"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="38"
        fontStyle="italic"
        fill="url(#shivoraGold)"
      >
        S
      </text>
    </svg>

    {/* ── Wordmark + underline ── */}
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '20px',
          letterSpacing: '4px',
          lineHeight: 1,
          // paddingRight compensates for the trailing letter-spacing gap on the
          // last character so the underline aligns flush with the visible text.
          paddingRight: '4px',
          background: GOLD_CSS,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        SHIVORA
      </span>
      {/* Fine gold underline — wordmark only, 0.8 px, 60 % opacity */}
      <div
        style={{
          height: '0.8px',
          marginTop: '4px',
          opacity: 0.6,
          background: GOLD_CSS,
        }}
      />
    </div>
  </Link>
)

export default Logo
