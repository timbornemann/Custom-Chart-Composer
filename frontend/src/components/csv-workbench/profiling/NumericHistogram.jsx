import PropTypes from 'prop-types'

const DEFAULT_HEIGHT = 80
const VIEWBOX_WIDTH = 100

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export default function NumericHistogram({ histogram, height = DEFAULT_HEIGHT }) {
  if (!histogram || !Array.isArray(histogram.bins) || histogram.bins.length === 0) {
    return null
  }

  const barCount = histogram.bins.length
  const maxCount = histogram.maxCount || Math.max(...histogram.bins.map((bin) => bin.count || 0), 1)
  const barWidth = VIEWBOX_WIDTH / barCount
  const baseline = height - 4

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      className="h-24 w-full"
      role="img"
      aria-label="Histogramm der numerischen Werte"
    >
      <line
        x1="0"
        y1={baseline}
        x2={VIEWBOX_WIDTH}
        y2={baseline}
        stroke="rgba(148, 163, 184, 0.4)"
        strokeWidth="0.75"
      />
      {histogram.bins.map((bin, index) => {
        const count = clamp(bin.count || 0, 0, Number.MAX_SAFE_INTEGER)
        const scaledHeight = maxCount > 0 ? (count / maxCount) * (height - 8) : 0
        const barHeight = Number.isFinite(scaledHeight) ? scaledHeight : 0
        const x = index * barWidth + barWidth * 0.1
        const y = baseline - barHeight

        return (
          <g key={`hist-bar-${index}`}>
            <rect
              x={x}
              y={y}
              width={barWidth * 0.8}
              height={barHeight}
              fill="url(#hist-gradient)"
              rx="0.6"
              ry="0.6"
            >
              <title>
                {`[${bin.from?.toLocaleString('de-DE') ?? '?'} – ${bin.to?.toLocaleString('de-DE') ?? '?'}]: ${count}`}
              </title>
            </rect>
          </g>
        )
      })}
      <defs>
        <linearGradient id="hist-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0.85)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0.3)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

NumericHistogram.propTypes = {
  histogram: PropTypes.shape({
    bins: PropTypes.arrayOf(
      PropTypes.shape({
        from: PropTypes.number,
        to: PropTypes.number,
        count: PropTypes.number
      })
    ),
    maxCount: PropTypes.number
  }),
  height: PropTypes.number
}

