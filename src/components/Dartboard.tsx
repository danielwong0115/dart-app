import type { MouseEvent } from 'react'
import type { Shot, End, DartboardSection } from '../utils/types'
import { 
  DARTBOARD_SEGMENTS,
  BULLSEYE_RADIUS,
  OUTER_BULL_RADIUS,
  TRIPLE_INNER_RADIUS,
  TRIPLE_OUTER_RADIUS,
  DOUBLE_INNER_RADIUS,
  DOUBLE_OUTER_RADIUS
} from '../utils/constants'

interface DartboardProps {
  currentRound: End[]
  currentEndIndex: number
  activeShot: Shot | null
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  selectedEndIndex?: number | null
  recommendedTarget?: DartboardSection | null
}

export const Dartboard = ({
  currentRound,
  currentEndIndex,
  activeShot,
  onTargetClick,
  selectedEndIndex,
  recommendedTarget,
}: DartboardProps) => {
  return (
    <div className="target-wrapper" onClick={onTargetClick} role="presentation">
      <svg className="dartboard" viewBox="-5 -5 110 110" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="double-clip">
            <circle cx="50" cy="50" r={DOUBLE_OUTER_RADIUS * 50} />
          </clipPath>
          <clipPath id="double-ring-clip">
            <circle cx="50" cy="50" r={DOUBLE_OUTER_RADIUS * 50} />
            <circle cx="50" cy="50" r={DOUBLE_INNER_RADIUS * 50} fill="black" />
          </clipPath>
          <clipPath id="triple-ring-clip">
            <circle cx="50" cy="50" r={TRIPLE_OUTER_RADIUS * 50} />
            <circle cx="50" cy="50" r={TRIPLE_INNER_RADIUS * 50} fill="black" />
          </clipPath>
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
          const angle = (index * 18) - 90 // Segment center at top (20 is at 0 degrees)
          const isBlack = index % 2 === 0
          const color = isBlack ? '#1a1a1a' : '#e8dcc4'
          const redGreen = isBlack ? '#dc2626' : '#16a34a'
          
          // Check if this segment should be highlighted
          const isRecommendedSingle = recommendedTarget?.type === 'single' && recommendedTarget?.number === segment
          const isRecommendedDouble = recommendedTarget?.type === 'double' && recommendedTarget?.number === segment
          const isRecommendedTriple = recommendedTarget?.type === 'triple' && recommendedTarget?.number === segment
          
          return (
            <g key={segment}>
              {/* Main segment area (single scoring area) */}
              <path
                className="dartboard-segment"
                d={describeArc(50, 50, DOUBLE_INNER_RADIUS * 50, angle - 9, angle + 9)}
                fill={color}
                stroke="#2d3748"
                strokeWidth="0.1"
                opacity={isRecommendedSingle ? 1 : 1}
              />
              {isRecommendedSingle && (
                <path
                  className="dartboard-segment-highlight"
                  d={describeArc(50, 50, DOUBLE_INNER_RADIUS * 50, angle - 9, angle + 9)}
                  fill="rgba(59, 130, 246, 0.4)"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              
              {/* Double ring */}
              <path
                className="dartboard-double"
                d={describeAnnularSegment(50, 50, DOUBLE_INNER_RADIUS * 50, DOUBLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                fill={redGreen}
                stroke="#2d3748"
                strokeWidth="0.1"
              />
              {isRecommendedDouble && (
                <path
                  className="dartboard-double-highlight"
                  d={describeAnnularSegment(50, 50, DOUBLE_INNER_RADIUS * 50, DOUBLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                  fill="rgba(59, 130, 246, 0.4)"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              
              {/* Triple ring */}
              <path
                className="dartboard-triple"
                d={describeAnnularSegment(50, 50, TRIPLE_INNER_RADIUS * 50, TRIPLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                fill={redGreen}
                stroke="#2d3748"
                strokeWidth="0.1"
              />
              {isRecommendedTriple && (
                <path
                  className="dartboard-triple-highlight"
                  d={describeAnnularSegment(50, 50, TRIPLE_INNER_RADIUS * 50, TRIPLE_OUTER_RADIUS * 50, angle - 9, angle + 9)}
                  fill="rgba(59, 130, 246, 0.4)"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              
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
              >
                {segment}
              </text>
            </g>
          )
        })}
        
        {/* Outer bull (25) */}
        <circle
          cx="50"
          cy="50"
          r={OUTER_BULL_RADIUS * 50}
          fill="#16a34a"
          className="dartboard-outer-bull"
          stroke="#2d3748"
          strokeWidth="0.2"
        />
        {recommendedTarget?.type === 'outer-bull' && (
          <circle
            cx="50"
            cy="50"
            r={OUTER_BULL_RADIUS * 50}
            fill="rgba(59, 130, 246, 0.4)"
            stroke="#3b82f6"
            strokeWidth="0.5"
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {/* Bullseye (50) */}
        <circle
          cx="50"
          cy="50"
          r={BULLSEYE_RADIUS * 50}
          fill="#dc2626"
          className="dartboard-bullseye"
          stroke="#2d3748"
          strokeWidth="0.2"
        />
        {recommendedTarget?.type === 'bullseye' && (
          <circle
            cx="50"
            cy="50"
            r={BULLSEYE_RADIUS * 50}
            fill="rgba(59, 130, 246, 0.4)"
            stroke="#3b82f6"
            strokeWidth="0.5"
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {/* Draw all shots */}
        {currentRound.flatMap((end, endIndex) =>
          end.shots.map((shot, shotIndex) => {
            const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
            const isMiss = distance > 1
            const hasMultipleEnds = currentRound.length > 1
            const turnColorClass = hasMultipleEnds ? `dart-marker--turn-${endIndex % 10}` : ''
            const isFaded = selectedEndIndex !== null && selectedEndIndex !== undefined && endIndex !== selectedEndIndex
            return (
              <circle
                key={`${endIndex}-${shotIndex}`}
                className={`dart-marker ${hasMultipleEnds ? turnColorClass : (endIndex === currentEndIndex ? 'dart-marker--current' : 'dart-marker--previous')} ${isMiss ? 'dart-marker--miss' : ''} ${isFaded ? 'dart-marker--faded' : ''}`}
                cx={(shot.x + 1) * 50}
                cy={(shot.y + 1) * 50}
                r="1.5"
              />
            )
          }),
        )}
        
        {/* Preview shot */}
        {activeShot && (
          <circle
            className={`dart-marker dart-marker--preview ${Math.sqrt(activeShot.x ** 2 + activeShot.y ** 2) > 1 ? 'dart-marker--miss' : ''}`}
            cx={(activeShot.x + 1) * 50}
            cy={(activeShot.y + 1) * 50}
            r="1.5"
          />
        )}
      </svg>
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
