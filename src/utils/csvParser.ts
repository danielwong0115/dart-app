import type { ReleaseTimingEntry } from './types'

/**
 * Parse microbit CSV data
 * Expected format: Time (seconds),Throw Count,Release Timing,Release Angle
 * Actual release angle = 90 - Release Angle from CSV
 */
export const parseMicrobitCSV = (csvText: string): ReleaseTimingEntry[] => {
  const lines = csvText.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  // Skip header row
  const dataLines = lines.slice(1)
  const entries: ReleaseTimingEntry[] = []

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim()
    if (!line) continue // Skip empty lines

    const parts = line.split(',').map(part => part.trim())
    
    if (parts.length !== 4) {
      console.warn(`Skipping invalid line ${i + 2}: ${line}`)
      continue
    }

    const time = parseFloat(parts[0])
    const throwCount = parseInt(parts[1], 10)
    const releaseTiming = parseInt(parts[2], 10)
    const releaseAngle = parseFloat(parts[3])

    // Validate data
    if (isNaN(time) || isNaN(throwCount) || isNaN(releaseTiming) || isNaN(releaseAngle)) {
      console.warn(`Skipping line ${i + 2} with invalid numbers: ${line}`)
      continue
    }

    if (releaseTiming !== 0 && releaseTiming !== 1 && releaseTiming !== 2) {
      console.warn(`Skipping line ${i + 2} with invalid release timing ${releaseTiming}: ${line}`)
      continue
    }

    entries.push({
      time,
      throwCount,
      releaseTiming: releaseTiming as 0 | 1 | 2,
      releaseAngle
    })
  }

  if (entries.length === 0) {
    throw new Error('No valid data found in CSV file')
  }

  return entries
}

/**
 * Calculate release timing statistics
 * Actual angle = 90 - angle from CSV
 */
export const calculateReleaseStats = (entries: ReleaseTimingEntry[]) => {
  const total = entries.length
  
  if (total === 0) {
    return {
      total: 0,
      early: 0,
      onTime: 0,
      late: 0,
      earlyPercentage: 0,
      onTimePercentage: 0,
      latePercentage: 0,
      averageAngle: 0,
      averageActualAngle: 0
    }
  }

  const early = entries.filter(e => e.releaseTiming === 0).length
  const onTime = entries.filter(e => e.releaseTiming === 1).length
  const late = entries.filter(e => e.releaseTiming === 2).length
  
  const totalAngle = entries.reduce((sum, e) => sum + e.releaseAngle, 0)
  const averageAngle = totalAngle / total
  const averageActualAngle = 90 - averageAngle

  return {
    total,
    early,
    onTime,
    late,
    earlyPercentage: (early / total) * 100,
    onTimePercentage: (onTime / total) * 100,
    latePercentage: (late / total) * 100,
    averageAngle,
    averageActualAngle
  }
}
