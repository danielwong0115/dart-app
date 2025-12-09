import type { FC } from 'react'
import type { ShotTendency } from '../../utils/types'

interface ShotTendencyDartboardProps {
  tendencies: ShotTendency[]
  selectedSection: string | null
  onSectionClick: (section: string) => void
}

const DARTBOARD_SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

export const ShotTendencyDartboard: FC<ShotTendencyDartboardProps> = ({
  tendencies,
  selectedSection,
  onSectionClick,
}) => {
  const tendencyMap = new Map(tendencies.map(t => [t.targetSection, t]))
  
  const getSectionKey = (type: string, number: number) => {
    if (type === 'bullseye') return 'bullseye-50'
    if (type === 'outer-bull') return 'outer-bull-25'
    return `${type}-${number}`
  }
  
  const hasData = (type: string, number: number) => {
    return tendencyMap.has(getSectionKey(type, number))
  }
  
  const isSelected = (type: string, number: number) => {
    return selectedSection === getSectionKey(type, number)
  }
  
  const getOpacity = (type: string, number: number) => {
    if (!hasData(type, number)) return 0.2
    if (isSelected(type, number)) return 1
    return 0.7
  }
  
  const getStrokeWidth = (type: string, number: number) => {
    return isSelected(type, number) ? 0.3 : 0.1
  }
  
  const getStrokeColor = (type: string, number: number) => {
    if (isSelected(type, number)) return '#6366f1'
    return '#2d3748'
  }

  const handleSectionClick = (type: string, number: number) => {
    if (!hasData(type, number)) return
    const key = getSectionKey(type, number)
    onSectionClick(selectedSection === key ? '' : key)
  }

  const renderSegments = () => {
    const segments = []
    
    for (let i = 0; i < 20; i++) {
      const number = DARTBOARD_SEGMENTS[i]
      const startAngle = (i * 18 - 9) * (Math.PI / 180)
      const endAngle = ((i + 1) * 18 - 9) * (Math.PI / 180)
      
      const color = i % 2 === 0 ? '#1a1a1a' : '#e8dcc4'
      
      // Outer single (between double and triple)
      const outerSinglePath = describeArc(50, 50, 46.5, 31, startAngle, endAngle)
      segments.push(
        <path
          key={`outer-single-${i}`}
          d={outerSinglePath}
          fill={color}
          opacity={getOpacity('single', number)}
          stroke={getStrokeColor('single', number)}
          strokeWidth={getStrokeWidth('single', number)}
          onClick={() => handleSectionClick('single', number)}
          style={{ cursor: hasData('single', number) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('single', number) ? 'dartboard-section--selected' : ''} ${!hasData('single', number) ? 'dartboard-section--no-data' : ''}`}
        />
      )
      
      // Inner single (between triple and bull)
      const innerSinglePath = describeArc(50, 50, 27.5, 6, startAngle, endAngle)
      segments.push(
        <path
          key={`inner-single-${i}`}
          d={innerSinglePath}
          fill={color}
          opacity={getOpacity('single', number)}
          stroke={getStrokeColor('single', number)}
          strokeWidth={getStrokeWidth('single', number)}
          onClick={() => handleSectionClick('single', number)}
          style={{ cursor: hasData('single', number) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('single', number) ? 'dartboard-section--selected' : ''} ${!hasData('single', number) ? 'dartboard-section--no-data' : ''}`}
        />
      )
      
      // Double ring
      const doublePath = describeArc(50, 50, 50, 46.5, startAngle, endAngle)
      segments.push(
        <path
          key={`double-${i}`}
          d={doublePath}
          fill={i % 2 === 0 ? '#ef4444' : '#22c55e'}
          opacity={getOpacity('double', number)}
          stroke={getStrokeColor('double', number)}
          strokeWidth={getStrokeWidth('double', number)}
          onClick={() => handleSectionClick('double', number)}
          style={{ cursor: hasData('double', number) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('double', number) ? 'dartboard-section--selected' : ''} ${!hasData('double', number) ? 'dartboard-section--no-data' : ''}`}
        />
      )
      
      // Triple ring
      const triplePath = describeArc(50, 50, 31, 27.5, startAngle, endAngle)
      segments.push(
        <path
          key={`triple-${i}`}
          d={triplePath}
          fill={i % 2 === 0 ? '#ef4444' : '#22c55e'}
          opacity={getOpacity('triple', number)}
          stroke={getStrokeColor('triple', number)}
          strokeWidth={getStrokeWidth('triple', number)}
          onClick={() => handleSectionClick('triple', number)}
          style={{ cursor: hasData('triple', number) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('triple', number) ? 'dartboard-section--selected' : ''} ${!hasData('triple', number) ? 'dartboard-section--no-data' : ''}`}
        />
      )
    }
    
    return segments
  }

  return (
    <div className="shot-tendency-dartboard-container">
      <svg viewBox="-5 -5 110 110" className="shot-tendency-dartboard">
        <defs>
          <filter id="blur-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          </filter>
        </defs>
        
        {/* Segments */}
        {renderSegments()}
        
        {/* Outer bull (25) */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="#22c55e"
          opacity={getOpacity('outer-bull', 25)}
          stroke={getStrokeColor('outer-bull', 25)}
          strokeWidth={getStrokeWidth('outer-bull', 25)}
          onClick={() => handleSectionClick('outer-bull', 25)}
          style={{ cursor: hasData('outer-bull', 25) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('outer-bull', 25) ? 'dartboard-section--selected' : ''} ${!hasData('outer-bull', 25) ? 'dartboard-section--no-data' : ''}`}
        />
        
        {/* Bullseye (50) */}
        <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="#ef4444"
          opacity={getOpacity('bullseye', 50)}
          stroke={getStrokeColor('bullseye', 50)}
          strokeWidth={getStrokeWidth('bullseye', 50)}
          onClick={() => handleSectionClick('bullseye', 50)}
          style={{ cursor: hasData('bullseye', 50) ? 'pointer' : 'not-allowed' }}
          className={`dartboard-section ${isSelected('bullseye', 50) ? 'dartboard-section--selected' : ''} ${!hasData('bullseye', 50) ? 'dartboard-section--no-data' : ''}`}
        />
        
        {/* Numbers */}
        {DARTBOARD_SEGMENTS.map((num, i) => {
          const angle = i * 18 * (Math.PI / 180)
          const x = 50 + Math.sin(angle) * 53
          const y = 50 - Math.cos(angle) * 53
          
          return (
            <text
              key={`num-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e2e8f0"
              fontSize="3.5"
              fontWeight="700"
              className="dartboard-number"
            >
              {num}
            </text>
          )
        })}
      </svg>
      
      <div className="shot-tendency-dartboard-legend">
        <div className="shot-tendency-dartboard-legend-item">
          <div className="shot-tendency-dartboard-legend-color" style={{ opacity: 0.7 }} />
          <span>Has Data (Click to View)</span>
        </div>
        <div className="shot-tendency-dartboard-legend-item">
          <div className="shot-tendency-dartboard-legend-color" style={{ opacity: 0.2 }} />
          <span>No Data Yet</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to describe an arc path
function describeArc(x: number, y: number, radiusOuter: number, radiusInner: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, radiusOuter, endAngle)
  const endOuter = polarToCartesian(x, y, radiusOuter, startAngle)
  const startInner = polarToCartesian(x, y, radiusInner, endAngle)
  const endInner = polarToCartesian(x, y, radiusInner, startAngle)
  
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  
  return [
    'M', startOuter.x, startOuter.y,
    'A', radiusOuter, radiusOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', radiusInner, radiusInner, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z'
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
  return {
    x: centerX + radius * Math.sin(angleInRadians),
    y: centerY - radius * Math.cos(angleInRadians)
  }
}
