import type { ReleaseTimingData } from '../../utils/types'
import { calculateReleaseStats } from '../../utils/csvParser'

interface ReleaseTimingStatsProps {
  releaseData: ReleaseTimingData | null
}

export const ReleaseTimingStats = ({ releaseData }: ReleaseTimingStatsProps) => {
  if (!releaseData || releaseData.entries.length === 0) {
    return (
      <div className="release-timing-empty">
        <p>Upload a Microbit CSV file to see your release timing analysis!</p>
      </div>
    )
  }

  const stats = calculateReleaseStats(releaseData.entries)

  const getTendency = () => {
    const { earlyPercentage, onTimePercentage, latePercentage } = stats
    
    if (onTimePercentage >= 50) {
      return { text: 'Excellent timing! 🎯', color: '#22c55e' }
    }
    
    if (earlyPercentage > onTimePercentage && earlyPercentage > latePercentage) {
      return { text: 'Tendency: Releasing Too Early ⏪', color: '#3b82f6' }
    }
    
    if (latePercentage > onTimePercentage && latePercentage > earlyPercentage) {
      return { text: 'Tendency: Releasing Too Late ⏩', color: '#f97316' }
    }
    
    return { text: 'Mixed timing patterns', color: '#a855f7' }
  }

  const tendency = getTendency()

  return (
    <div className="release-timing-stats">
      <h3 className="release-timing-stats__title">Release Timing Analysis</h3>
      <p className="release-timing-stats__subtitle">
        Based on {stats.total} recorded throws • Uploaded {new Date(releaseData.uploadedAt).toLocaleDateString()}
      </p>
      
      <div className="release-timing-stats__summary" style={{ borderColor: tendency.color }}>
        <p className="release-timing-stats__tendency" style={{ color: tendency.color }}>
          {tendency.text}
        </p>
        <div className="release-timing-stats__angles">
          <p className="release-timing-stats__angle">
            Average Release Angle: <strong>{stats.averageActualAngle.toFixed(1)}°</strong>
          </p>
          <p className="release-timing-stats__angle-detail">
            (90° - {stats.averageAngle.toFixed(1)}° sensor reading)
          </p>
        </div>
      </div>

      <div className="release-timing-stats__bars">
        <div className="release-timing-bar">
          <div className="release-timing-bar__label">
            <span className="release-timing-bar__name">Too Early (Before Ideal Angle)</span>
            <span className="release-timing-bar__value">{stats.earlyPercentage.toFixed(1)}%</span>
          </div>
          <div className="release-timing-bar__track">
            <div 
              className="release-timing-bar__fill"
              style={{ 
                width: `${stats.earlyPercentage}%`,
                backgroundColor: '#3b82f6'
              }}
            />
          </div>
          <span className="release-timing-bar__count">{stats.early} throws</span>
        </div>

        <div className="release-timing-bar">
          <div className="release-timing-bar__label">
            <span className="release-timing-bar__name">On Time (At Ideal Angle) ✓</span>
            <span className="release-timing-bar__value">{stats.onTimePercentage.toFixed(1)}%</span>
          </div>
          <div className="release-timing-bar__track">
            <div 
              className="release-timing-bar__fill"
              style={{ 
                width: `${stats.onTimePercentage}%`,
                backgroundColor: stats.onTimePercentage >= 50 ? '#22c55e' : '#eab308'
              }}
            />
          </div>
          <span className="release-timing-bar__count">{stats.onTime} throws</span>
        </div>

        <div className="release-timing-bar">
          <div className="release-timing-bar__label">
            <span className="release-timing-bar__name">Too Late (After Ideal Angle)</span>
            <span className="release-timing-bar__value">{stats.latePercentage.toFixed(1)}%</span>
          </div>
          <div className="release-timing-bar__track">
            <div 
              className="release-timing-bar__fill"
              style={{ 
                width: `${stats.latePercentage}%`,
                backgroundColor: '#f97316'
              }}
            />
          </div>
          <span className="release-timing-bar__count">{stats.late} throws</span>
        </div>
      </div>

      <div className="release-timing-stats__footer">
        <p className="release-timing-stats__info">
          💡 Aim for consistent "On Time" releases at the ideal angle for better accuracy
        </p>
      </div>
    </div>
  )
}
