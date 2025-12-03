import type { MouseEvent } from 'react'
import type { Game } from '../../utils/types'
import { 
  DARTBOARD_SEGMENTS,
  BULLSEYE_RADIUS,
  OUTER_BULL_RADIUS,
  TRIPLE_INNER_RADIUS,
  TRIPLE_OUTER_RADIUS,
  DOUBLE_INNER_RADIUS,
  DOUBLE_OUTER_RADIUS
} from '../../utils/constants'

interface AccuracyDartboardProps {
  games: Game[]
  selectedSection: string | null
  onSectionClick: (section: string) => void
}

const getSectionKey = (type: string, number: number): string => {
  if (type === 'bullseye') return 'bullseye'
  if (type === 'outer-bull') return 'outer-bull'
  return `${type}-${number}`
}

const calculateAccuracyStats = (games: Game[]): Map<string, number> => {
  const accuracyMap = new Map<string, number>()
  
  // Only consider training games
  const trainingGames = games.filter(game => game.gameMode === 'training' && game.trainingAccuracy)
  
  if (trainingGames.length === 0) return accuracyMap
  
  // Aggregate all section data
  const aggregated: Record<string, { attempts: number; hits: number }> = {}
  
  trainingGames.forEach(game => {
    if (!game.trainingAccuracy) return
    
    Object.entries(game.trainingAccuracy.sections).forEach(([key, data]) => {
      if (!aggregated[key]) {
        aggregated[key] = { attempts: 0, hits: 0 }
      }
      aggregated[key].attempts += data.attempts
      aggregated[key].hits += data.hits
    })
  })
  
  // Calculate accuracy percentages
  Object.entries(aggregated).forEach(([key, data]) => {
    if (data.attempts > 0) {
      accuracyMap.set(key, (data.hits / data.attempts) * 100)
    }
  })
  
  return accuracyMap
}

export const AccuracyDartboard = ({ games, selectedSection, onSectionClick }: AccuracyDartboardProps) => {
  const accuracyMap = calculateAccuracyStats(games)
  
  const getAccuracyColor = (accuracy: number | undefined): string => {
    if (accuracy === undefined) return '#4a5568' // Gray for no data
    if (accuracy >= 75) return '#10b981' // Green
    if (accuracy >= 50) return '#f59e0b' // Orange
    if (accuracy >= 25) return '#ef4444' // Red
    return '#991b1b' // Dark red
  }
  
  const getAccuracyText = (accuracy: number | undefined): string => {
    if (accuracy === undefined) return '-'
    return `${Math.round(accuracy)}%`
  }
  
  const handleSectionClick = (event: MouseEvent, sectionKey: string) => {
    event.stopPropagation()
    onSectionClick(sectionKey)
  }
  
  return (
    <div className="accuracy-dartboard-container">
      <svg className="accuracy-dartboard" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="section-highlight">
            <feDropShadow dx="0" dy="0" stdDeviation="0.5" floodColor="#fbbf24" floodOpacity="0.8"/>
          </filter>
        </defs>
        
        {/* Background circle for dartboard */}
        <circle
          cx="50"
          cy="50"
          r="50"
          fill="#1a1a1a"
          stroke="#4a5568"
          strokeWidth="0.6"
          style={{ filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.5))' }}
        />
        
        {/* Draw segments */}
        {DARTBOARD_SEGMENTS.map((segment, index) => {
          const angle = (index * 18) - 90
          const isBlack = index % 2 === 0
          const baseColor = isBlack ? '#1a1a1a' : '#e8dcc4'
          const redGreen = isBlack ? '#dc2626' : '#16a34a'
          
          const singleKey = getSectionKey('single', segment)
          const doubleKey = getSectionKey('double', segment)
          const tripleKey = getSectionKey('triple', segment)
          
          const singleAccuracy = accuracyMap.get(singleKey)
          const doubleAccuracy = accuracyMap.get(doubleKey)
          const tripleAccuracy = accuracyMap.get(tripleKey)
          
          const singleColor = singleAccuracy !== undefined ? getAccuracyColor(singleAccuracy) : baseColor
          const doubleColor = doubleAccuracy !== undefined ? getAccuracyColor(doubleAccuracy) : redGreen
          const tripleColor = tripleAccuracy !== undefined ? getAccuracyColor(tripleAccuracy) : redGreen
          
          const singleSelected = selectedSection === singleKey
          const doubleSelected = selectedSection === doubleKey
          const tripleSelected = selectedSection === tripleKey
          
          return (
            <g key={segment}>
              {/* Main segment area (single scoring area) */}
              <path
                className={`dartboard-segment clickable ${singleSelected ? 'selected' : ''}`}
                d={describeArc(50, 50, DOUBLE_INNER_RADIUS * 50, angle - 9, angle + 9)}
                fill={singleColor}
                stroke="#2d3748"
                strokeWidth="0.2"
                onClick={(e) => handleSectionClick(e, singleKey)}
                style={{ cursor: 'pointer' }}
                filter={singleSelected ? 'url(#section-highlight)' : undefined}
              />
              
              {/* Double ring */}
              <path
                className={`dartboard-double clickable ${doubleSelected ? 'selected' : ''}`}
                d={describeAnnularSegment(50, 50, DOUBLE_INNER_RADIUS * 50, DOUBLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                fill={doubleColor}
                stroke="#2d3748"
                strokeWidth="0.2"
                onClick={(e) => handleSectionClick(e, doubleKey)}
                style={{ cursor: 'pointer' }}
                filter={doubleSelected ? 'url(#section-highlight)' : undefined}
              />
              
              {/* Triple ring */}
              <path
                className={`dartboard-triple clickable ${tripleSelected ? 'selected' : ''}`}
                d={describeAnnularSegment(50, 50, TRIPLE_INNER_RADIUS * 50, TRIPLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                fill={tripleColor}
                stroke="#2d3748"
                strokeWidth="0.2"
                onClick={(e) => handleSectionClick(e, tripleKey)}
                style={{ cursor: 'pointer' }}
                filter={tripleSelected ? 'url(#section-highlight)' : undefined}
              />
              
              {/* Segment number - positioned outside the dartboard */}
              <text
                x={50 + Math.cos((angle) * Math.PI / 180) * 53}
                y={50 + Math.sin((angle) * Math.PI / 180) * 53}
                className="dartboard-number"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e2e8f0"
                fontSize="4.5"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {segment}
              </text>
              
              {/* Display accuracy text for singles */}
              {singleAccuracy !== undefined && (
                <text
                  x={50 + Math.cos((angle) * Math.PI / 180) * 35}
                  y={50 + Math.sin((angle) * Math.PI / 180) * 35}
                  className="accuracy-text"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2.5"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {getAccuracyText(singleAccuracy)}
                </text>
              )}
              
              {/* Display accuracy text for doubles */}
              {doubleAccuracy !== undefined && (
                <text
                  x={50 + Math.cos((angle) * Math.PI / 180) * 47.5}
                  y={50 + Math.sin((angle) * Math.PI / 180) * 47.5}
                  className="accuracy-text"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {getAccuracyText(doubleAccuracy)}
                </text>
              )}
              
              {/* Display accuracy text for triples */}
              {tripleAccuracy !== undefined && (
                <text
                  x={50 + Math.cos((angle) * Math.PI / 180) * 29}
                  y={50 + Math.sin((angle) * Math.PI / 180) * 29}
                  className="accuracy-text"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {getAccuracyText(tripleAccuracy)}
                </text>
              )}
            </g>
          )
        })}
        
        {/* Outer bull (25) */}
        <circle
          cx="50"
          cy="50"
          r={OUTER_BULL_RADIUS * 50}
          fill={getAccuracyColor(accuracyMap.get('outer-bull'))}
          className={`dartboard-outer-bull clickable ${selectedSection === 'outer-bull' ? 'selected' : ''}`}
          stroke="#2d3748"
          strokeWidth="0.2"
          onClick={(e) => handleSectionClick(e, 'outer-bull')}
          style={{ cursor: 'pointer' }}
          filter={selectedSection === 'outer-bull' ? 'url(#section-highlight)' : undefined}
        />
        
        {/* Outer bull text */}
        {accuracyMap.get('outer-bull') !== undefined && (
          <text
            x="50"
            y="55"
            className="accuracy-text"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="2"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {getAccuracyText(accuracyMap.get('outer-bull'))}
          </text>
        )}
        
        {/* Bullseye (50) */}
        <circle
          cx="50"
          cy="50"
          r={BULLSEYE_RADIUS * 50}
          fill={getAccuracyColor(accuracyMap.get('bullseye'))}
          className={`dartboard-bullseye clickable ${selectedSection === 'bullseye' ? 'selected' : ''}`}
          stroke="#2d3748"
          strokeWidth="0.2"
          onClick={(e) => handleSectionClick(e, 'bullseye')}
          style={{ cursor: 'pointer' }}
          filter={selectedSection === 'bullseye' ? 'url(#section-highlight)' : undefined}
        />
        
        {/* Bullseye text */}
        {accuracyMap.get('bullseye') !== undefined && (
          <text
            x="50"
            y="50"
            className="accuracy-text"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="1.5"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {getAccuracyText(accuracyMap.get('bullseye'))}
          </text>
        )}
      </svg>
      
      <div className="accuracy-legend">
        <div className="accuracy-legend-item">
          <div className="accuracy-legend-color" style={{ backgroundColor: '#10b981' }} />
          <span>75-100%</span>
        </div>
        <div className="accuracy-legend-item">
          <div className="accuracy-legend-color" style={{ backgroundColor: '#f59e0b' }} />
          <span>50-74%</span>
        </div>
        <div className="accuracy-legend-item">
          <div className="accuracy-legend-color" style={{ backgroundColor: '#ef4444' }} />
          <span>25-49%</span>
        </div>
        <div className="accuracy-legend-item">
          <div className="accuracy-legend-color" style={{ backgroundColor: '#991b1b' }} />
          <span>0-24%</span>
        </div>
        <div className="accuracy-legend-item">
          <div className="accuracy-legend-color" style={{ backgroundColor: '#4a5568' }} />
          <span>No data</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to describe an arc path for a segment
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  
  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ')
}

// Helper function to describe an annular (ring) segment
function describeAnnularSegment(
  x: number, 
  y: number, 
  innerRadius: number, 
  outerRadius: number, 
  startAngle: number, 
  endAngle: number
): string {
  const outerStart = polarToCartesian(x, y, outerRadius, endAngle)
  const outerEnd = polarToCartesian(x, y, outerRadius, startAngle)
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle)
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle)
  
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  
  return [
    'M', outerStart.x, outerStart.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z'
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}
