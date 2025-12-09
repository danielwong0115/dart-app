import type { Game, Shot, ShotTendency } from './types'

// Helper to determine what section a shot landed in
const identifyShotSection = (shot: Shot): { type: string; number: number; displayName: string } | null => {
  const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
  
  // Check bullseye
  if (distance <= 0.05) {
    return { type: 'bullseye', number: 50, displayName: 'Bullseye' }
  }
  
  // Check outer bull
  if (distance <= 0.12) {
    return { type: 'outer-bull', number: 25, displayName: 'Outer Bull (25)' }
  }
  
  // Miss - outside dartboard
  if (distance > 1) {
    return { type: 'miss', number: 0, displayName: 'Miss (Outside Board)' }
  }
  
  // Calculate angle to determine segment
  let angle = Math.atan2(shot.y, shot.x) * (180 / Math.PI)
  angle = (angle + 90 + 360) % 360
  
  const segmentIndex = Math.floor(((angle + 9) % 360) / 18)
  const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
  const hitNumber = segments[segmentIndex]
  
  // Determine ring type
  if (distance >= 0.55 && distance <= 0.62) {
    return { type: 'triple', number: hitNumber, displayName: `Triple ${hitNumber}` }
  }
  
  if (distance >= 0.93 && distance <= 1.0) {
    return { type: 'double', number: hitNumber, displayName: `Double ${hitNumber}` }
  }
  
  return { type: 'single', number: hitNumber, displayName: `Single ${hitNumber}` }
}

// Helper to get section key
const getSectionKey = (type: string, number: number): string => {
  if (type === 'bullseye') return 'bullseye-50'
  if (type === 'outer-bull') return 'outer-bull-25'
  if (type === 'miss') return 'miss-0'
  return `${type}-${number}`
}

// Analyze directional bias based on target position vs actual shot position
const analyzeDirectionalBias = (targetKey: string, missedShots: Shot[]): {
  tooHigh: number
  tooLow: number
  tooLeft: number
  tooRight: number
} => {
  if (missedShots.length === 0) {
    return { tooHigh: 0, tooLow: 0, tooLeft: 0, tooRight: 0 }
  }

  // Parse target to get its expected position
  const [targetType, targetNumStr] = targetKey.split('-')
  const targetNum = parseInt(targetNumStr)
  
  let targetX = 0
  let targetY = 0
  
  // Calculate expected position of target
  if (targetType === 'bullseye' || targetType === 'outer-bull') {
    targetX = 0
    targetY = 0
  } else if (targetNum > 0) {
    // Find angle for this number on dartboard
    const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
    const segmentIndex = segments.indexOf(targetNum)
    if (segmentIndex >= 0) {
      const angle = (segmentIndex * 18 - 9) * (Math.PI / 180) // -90 degrees offset
      const radius = targetType === 'triple' ? 0.585 : targetType === 'double' ? 0.965 : 0.75
      targetX = Math.sin(angle) * radius
      targetY = -Math.cos(angle) * radius
    }
  }
  
  let tooHigh = 0
  let tooLow = 0
  let tooLeft = 0
  let tooRight = 0
  
  missedShots.forEach(shot => {
    const deltaX = shot.x - targetX
    const deltaY = shot.y - targetY
    
    // Y-axis (higher y = lower on screen)
    if (deltaY < -0.05) tooHigh++
    else if (deltaY > 0.05) tooLow++
    
    // X-axis
    if (deltaX < -0.05) tooLeft++
    else if (deltaX > 0.05) tooRight++
  })
  
  return { tooHigh, tooLow, tooLeft, tooRight }
}

export const analyzeShotTendencies = (games: Game[]): ShotTendency[] => {
  // Filter for training games with accuracy data
  const trainingGames = games.filter(g => 
    g.gameMode === 'training' && 
    g.trainingAccuracy && 
    g.trainingAccuracy.sections
  )
  
  if (trainingGames.length === 0) return []
  
  // Aggregate all section data
  const aggregatedSections = new Map<string, {
    attempts: number
    hits: number
    missedShots: Shot[]
    displayName: string
  }>()
  
  trainingGames.forEach(game => {
    if (!game.trainingAccuracy) return
    
    Object.entries(game.trainingAccuracy.sections).forEach(([key, data]) => {
      const current = aggregatedSections.get(key) || {
        attempts: 0,
        hits: 0,
        missedShots: [],
        displayName: key.replace('-', ' ').split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ')
      }
      
      aggregatedSections.set(key, {
        attempts: current.attempts + data.attempts,
        hits: current.hits + data.hits,
        missedShots: [...current.missedShots, ...(data.missedShots || [])],
        displayName: current.displayName
      })
    })
  })
  
  // Convert to ShotTendency array
  const tendencies: ShotTendency[] = []
  
  aggregatedSections.forEach((data, sectionKey) => {
    if (data.attempts < 3) return // Skip sections with too few attempts
    
    const hitRate = (data.hits / data.attempts) * 100
    const misses = data.missedShots
    
    // Analyze directional bias
    const directionalBias = analyzeDirectionalBias(sectionKey, misses)
    
    // Analyze where misses actually went
    const missLocationCounts = new Map<string, number>()
    misses.forEach(shot => {
      const section = identifyShotSection(shot)
      if (section) {
        const key = getSectionKey(section.type, section.number)
        missLocationCounts.set(key, (missLocationCounts.get(key) || 0) + 1)
      }
    })
    
    // Get top 3 common miss locations
    const commonMisses = Array.from(missLocationCounts.entries())
      .map(([key, count]) => {
        const section = identifyShotSection(
          misses.find(s => {
            const sec = identifyShotSection(s)
            return sec && getSectionKey(sec.type, sec.number) === key
          })!
        )
        return {
          section: key,
          displayName: section?.displayName || key,
          count,
          percentage: (count / misses.length) * 100
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
    
    tendencies.push({
      targetSection: sectionKey,
      targetDisplayName: data.displayName,
      attempts: data.attempts,
      hits: data.hits,
      hitRate,
      directionalBias,
      commonMisses
    })
  })
  
  // Sort by attempts (most practiced first)
  return tendencies.sort((a, b) => b.attempts - a.attempts)
}
