import PropTypes from 'prop-types'

const VIEWBOX_WIDTH = 100
const DEFAULT_HEIGHT = 80

const buildPath = (points, baseline) => {
  if (points.length === 0) {
    return ''
  }

  const [firstPoint, ...rest] = points
  const pathCommands = [`M ${firstPoint.x} ${firstPoint.y}`]
  rest.forEach((point) => {
    pathCommands.push(`L ${point.x} ${point.y}`)
  })

  const lastPoint = points[points.length - 1]
  return `${pathCommands.join(' ')} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`
}

export default function TextValueSparkline({ values, height = DEFAULT_HEIGHT }) {
  if (!Array.isArray(values) || values.length === 0) {
    return null
  }

  const counts = values.map((entry) => entry?.count ?? 0)
  const maxCount = Math.max(...counts, 1)
  const pointCount = values.length
  const step = pointCount > 1 ? VIEWBOX_WIDTH / (pointCount - 1) : 0
  const topPadding = 6
  const availableHeight = height - topPadding - 6
  const baseline = topPadding + availableHeight

  const points = values.map((entry, index) => {
    const count = entry?.count ?? 0
    const ratio = maxCount > 0 ? count / maxCount : 0
    const x = pointCount > 1 ? index * step : VIEWBOX_WIDTH / 2
    const y = baseline - ratio * availableHeight
    return {
      x: Number.isFinite(x) ? Number(x.toFixed(2)) : 0,
      y: Number.isFinite(y) ? Number(y.toFixed(2)) : baseline,
      value: entry?.value ?? ''
    }
  })

  const areaPath = buildPath(points, baseline)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      className="h-24 w-full"
      role="img"
      aria-label="Sparkline der häufigsten Textwerte"
    >
      <path d={areaPath} fill="rgba(96, 165, 250, 0.25)" stroke="none" />
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="none"
        stroke="rgba(96, 165, 250, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <g key={`spark-point-${index}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r={1.8}
            fill="rgba(59, 130, 246, 0.95)"
          >
            <title>{`${point.value || '(leer)'}: ${counts[index]}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}

TextValueSparkline.propTypes = {
  values: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      count: PropTypes.number
    })
  ),
  height: PropTypes.number
}

