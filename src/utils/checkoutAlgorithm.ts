import type { TrainingAccuracyData, DartboardSection } from './types'
import { DARTBOARD_SEGMENTS } from './constants'

export type CheckoutTarget = {
  section: DartboardSection
  sectionKey: string
  score: number
  accuracy: number
}

export type CheckoutPath = {
  targets: CheckoutTarget[]
  totalAccuracy: number
  remainingScore: number
}

/**
 * Get the accuracy for a specific section from training data
 * Returns 1.0 (100%) if no data exists for this section
 */
const getSectionAccuracy = (
  sectionKey: string,
  allTrainingData: TrainingAccuracyData[]
): number => {
  let totalAttempts = 0
  let totalHits = 0

  for (const trainingData of allTrainingData) {
    const sectionData = trainingData.sections[sectionKey]
    if (sectionData) {
      totalAttempts += sectionData.attempts
      totalHits += sectionData.hits
    }
  }

  // If no data exists, treat as 100% accuracy
  if (totalAttempts === 0) return 1.0

  return totalHits / totalAttempts
}

/**
 * Generate all possible targets on a dartboard
 */
const getAllPossibleTargets = (allTrainingData: TrainingAccuracyData[]): CheckoutTarget[] => {
  const targets: CheckoutTarget[] = []

  // Add all single, double, and triple segments
  for (const segment of DARTBOARD_SEGMENTS) {
    // Single
    const singleKey = `single-${segment}`
    targets.push({
      section: { type: 'single', number: segment },
      sectionKey: singleKey,
      score: segment,
      accuracy: getSectionAccuracy(singleKey, allTrainingData)
    })

    // Double
    const doubleKey = `double-${segment}`
    targets.push({
      section: { type: 'double', number: segment },
      sectionKey: doubleKey,
      score: segment * 2,
      accuracy: getSectionAccuracy(doubleKey, allTrainingData)
    })

    // Triple
    const tripleKey = `triple-${segment}`
    targets.push({
      section: { type: 'triple', number: segment },
      sectionKey: tripleKey,
      score: segment * 3,
      accuracy: getSectionAccuracy(tripleKey, allTrainingData)
    })
  }

  // Add bullseye (50)
  targets.push({
    section: { type: 'bullseye', number: 50 },
    sectionKey: 'bullseye-50',
    score: 50,
    accuracy: getSectionAccuracy('bullseye-50', allTrainingData)
  })

  // Add outer bull (25)
  targets.push({
    section: { type: 'outer-bull', number: 25 },
    sectionKey: 'outer-bull-25',
    score: 25,
    accuracy: getSectionAccuracy('outer-bull-25', allTrainingData)
  })

  return targets
}

/**
 * Find the optimal checkout path for a given score
 * Prioritizes: 1) Getting to exactly 0, 2) Highest combined accuracy
 * Uses up to 3 darts per turn
 */
export const findOptimalCheckout = (
  remainingScore: number,
  dartsRemaining: number,
  allTrainingData: TrainingAccuracyData[]
): CheckoutPath | null => {
  // Can't checkout with 0 darts or if score is already 0
  if (dartsRemaining === 0 || remainingScore === 0) {
    return null
  }

  // Only recommend checkouts for 180 or less
  if (remainingScore > 180) {
    return null
  }

  const allTargets = getAllPossibleTargets(allTrainingData)
  
  // Use dynamic programming to find all possible checkout paths
  const findPaths = (score: number, darts: number): CheckoutPath[] => {
    // Base case: score is 0, we found a valid path
    if (score === 0) {
      return [{
        targets: [],
        totalAccuracy: 1.0,
        remainingScore: 0
      }]
    }

    // Base case: no darts left or score is negative
    if (darts === 0 || score < 0) {
      return []
    }

    const paths: CheckoutPath[] = []

    // Try each possible target
    for (const target of allTargets) {
      // Skip if this target would overshoot
      if (target.score > score) continue

      const newScore = score - target.score

      // Recursively find paths from the new score
      const subPaths = findPaths(newScore, darts - 1)

      // Add this target to each subpath
      for (const subPath of subPaths) {
        paths.push({
          targets: [target, ...subPath.targets],
          totalAccuracy: target.accuracy * subPath.totalAccuracy,
          remainingScore: subPath.remainingScore
        })
      }

      // Also consider this as a final dart if it gets us close
      if (darts === 1 || newScore === 0) {
        paths.push({
          targets: [target],
          totalAccuracy: target.accuracy,
          remainingScore: newScore
        })
      }
    }

    return paths
  }

  const allPaths = findPaths(remainingScore, Math.min(dartsRemaining, 3))

  if (allPaths.length === 0) {
    return null
  }

  // Sort paths by:
  // 1. Paths that reach exactly 0 (remainingScore === 0)
  // 2. Highest total accuracy
  // 3. Lowest remaining score (get as close as possible)
  allPaths.sort((a, b) => {
    // Prioritize paths that reach 0
    if (a.remainingScore === 0 && b.remainingScore !== 0) return -1
    if (a.remainingScore !== 0 && b.remainingScore === 0) return 1

    // Among paths with same remainingScore status, prefer higher accuracy
    if (Math.abs(a.totalAccuracy - b.totalAccuracy) > 0.0001) {
      return b.totalAccuracy - a.totalAccuracy
    }

    // If accuracy is similar, prefer lower remaining score
    return a.remainingScore - b.remainingScore
  })

  return allPaths[0]
}

/**
 * Check if a score is "checkable" (can reach exactly 0) with the given number of darts
 */
const isCheckableScore = (score: number, darts: number, allTargets: CheckoutTarget[]): boolean => {
  if (score === 0) return true
  if (darts === 0) return score === 0
  if (score < 0) return false
  
  // Quick check: can we reach this score at all?
  for (const target of allTargets) {
    if (target.score > score) continue
    const newScore = score - target.score
    if (newScore === 0) return true
    if (darts > 1 && isCheckableScore(newScore, darts - 1, allTargets)) {
      return true
    }
  }
  
  return false
}

/**
 * Get the recommended target for the next dart
 */
export const getRecommendedTarget = (
  remainingScore: number,
  dartsRemainingInTurn: number,
  allTrainingData: TrainingAccuracyData[]
): CheckoutTarget | null => {
  const optimalPath = findOptimalCheckout(remainingScore, dartsRemainingInTurn, allTrainingData)
  
  if (!optimalPath || optimalPath.targets.length === 0) {
    return null
  }

  const recommendedTarget = optimalPath.targets[0]
  
  // Safety check: ensure this target won't leave an uncheckable score
  // This prevents recommending Triple 20 when it would leave an impossible checkout
  const scoreAfterTarget = remainingScore - recommendedTarget.score
  
  if (scoreAfterTarget > 0 && dartsRemainingInTurn > 1) {
    const allTargets = getAllPossibleTargets(allTrainingData)
    // Check if the remaining score can be checked out with remaining darts
    if (!isCheckableScore(scoreAfterTarget, dartsRemainingInTurn - 1, allTargets)) {
      // This would leave an uncheckable score, find an alternative
      // Look for other paths that don't have this problem
      const allPaths = findOptimalCheckout(remainingScore, dartsRemainingInTurn, allTrainingData)
      
      if (allPaths) {
        // Re-generate all possible paths and filter out those leading to uncheckable scores
        const findAllPaths = (score: number, darts: number): CheckoutPath[] => {
          if (score === 0) {
            return [{
              targets: [],
              totalAccuracy: 1.0,
              remainingScore: 0
            }]
          }
          if (darts === 0 || score < 0) return []
          
          const paths: CheckoutPath[] = []
          for (const target of allTargets) {
            if (target.score > score) continue
            const newScore = score - target.score
            
            // Skip if this would leave an uncheckable score (for non-final darts)
            if (newScore > 0 && darts > 1 && !isCheckableScore(newScore, darts - 1, allTargets)) {
              continue
            }
            
            const subPaths = findAllPaths(newScore, darts - 1)
            for (const subPath of subPaths) {
              paths.push({
                targets: [target, ...subPath.targets],
                totalAccuracy: target.accuracy * subPath.totalAccuracy,
                remainingScore: subPath.remainingScore
              })
            }
            
            if (darts === 1 || newScore === 0) {
              paths.push({
                targets: [target],
                totalAccuracy: target.accuracy,
                remainingScore: newScore
              })
            }
          }
          return paths
        }
        
        const safePaths = findAllPaths(remainingScore, Math.min(dartsRemainingInTurn, 3))
        
        if (safePaths.length > 0) {
          // Sort by same criteria
          safePaths.sort((a, b) => {
            if (a.remainingScore === 0 && b.remainingScore !== 0) return -1
            if (a.remainingScore !== 0 && b.remainingScore === 0) return 1
            if (Math.abs(a.totalAccuracy - b.totalAccuracy) > 0.0001) {
              return b.totalAccuracy - a.totalAccuracy
            }
            return a.remainingScore - b.remainingScore
          })
          
          return safePaths[0].targets[0]
        }
      }
    }
  }

  // Return the first target in the optimal path
  return recommendedTarget
}
