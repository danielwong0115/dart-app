import type { End, Shot } from './types'
import { 
  DARTBOARD_SEGMENTS, 
  TARGET_RADIUS_UNITS, 
  BULLSEYE_RADIUS, 
  OUTER_BULL_RADIUS, 
  TRIPLE_INNER_RADIUS, 
  TRIPLE_OUTER_RADIUS, 
  DOUBLE_INNER_RADIUS, 
  DOUBLE_OUTER_RADIUS 
} from './constants'

// Legacy function for compatibility
export const generateEndTemplate = (): End => ({
  shots: [],
  endScore: 0,
  precision: 0,
})

export const calculateScore = (x: number, y: number): number => {
  const distance = Math.sqrt(x * x + y * y)
  
  // Miss - outside the dartboard
  if (distance > 1) return 0
  
  // Bullseye (50 points)
  if (distance <= BULLSEYE_RADIUS) return 50
  
  // Outer bull (25 points)
  if (distance <= OUTER_BULL_RADIUS) return 25
  
  // Calculate angle to determine segment
  let angle = Math.atan2(y, x) * (180 / Math.PI)
  angle = (angle + 90 + 360) % 360 // Normalize to 0-360, with 0 at top
  
  // Each segment is 18 degrees (360 / 20)
  const segmentIndex = Math.floor(((angle + 9) % 360) / 18)
  const segmentValue = DARTBOARD_SEGMENTS[segmentIndex] || 20
  
  // Check for triple ring
  if (distance >= TRIPLE_INNER_RADIUS && distance <= TRIPLE_OUTER_RADIUS) {
    return segmentValue * 3
  }
  
  // Check for double ring
  if (distance >= DOUBLE_INNER_RADIUS && distance <= DOUBLE_OUTER_RADIUS) {
    return segmentValue * 2
  }
  
  // Single segment value
  return segmentValue
}

export const generateDartboardColors = (): { segment: number; color: string }[] => {
  // Dartboard alternates between black and cream for segments
  return DARTBOARD_SEGMENTS.map((segment, index) => ({
    segment,
    color: index % 2 === 0 ? '#1a1a1a' : '#e8dcc4'
  }))
}

// Legacy archery function - kept for compatibility during migration
export const generateRingColors = (ringCount: number): string[] => {
  const bandColors = ['#e6d100', '#e4442c', '#23a0d6', '#484239', '#d3c5b3']
  const colors: string[] = []

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const bandIndex = Math.floor(ringIndex / 2)
    const color = bandColors[Math.min(bandIndex, bandColors.length - 1)]
    colors.push(color)
  }

  return colors.reverse()
}



export const calculateDistanceFromCenter = (shot: Shot, targetRadius = TARGET_RADIUS_UNITS): number => {
  const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
  return distance * targetRadius
}

export const calculateDistanceBetweenShots = (first: Shot, second: Shot, targetRadius = TARGET_RADIUS_UNITS): number => {
  const deltaX = first.x - second.x
  const deltaY = first.y - second.y
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
  return distance * targetRadius
}

export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) {
    return 0
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

export const calculateEndPrecision = (shots: Shot[], targetRadius = TARGET_RADIUS_UNITS): number => {
  if (shots.length <= 1) {
    return 0
  }

  // Calculate the center of the group (mean x and y coordinates)
  const centerX = calculateAverage(shots.map(shot => shot.x))
  const centerY = calculateAverage(shots.map(shot => shot.y))

  // Calculate distance of each shot from the group center
  const distances = shots.map(shot => {
    const deltaX = shot.x - centerX
    const deltaY = shot.y - centerY
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
    return distance * targetRadius
  })

  // Return the mean radius (average distance from group center)
  return calculateAverage(distances)
}
