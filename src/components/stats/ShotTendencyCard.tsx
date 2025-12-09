import type { FC } from 'react'
import type { ShotTendency } from '../../utils/types'

interface ShotTendencyCardProps {
  tendency: ShotTendency
}

export const ShotTendencyCard: FC<ShotTendencyCardProps> = ({ tendency }) => {
  const { targetDisplayName, attempts, hits, hitRate, directionalBias, commonMisses } = tendency
  
  // Find dominant directional bias
  const biasValues = [
    { label: 'Too High', value: directionalBias.tooHigh, icon: '↑' },
    { label: 'Too Low', value: directionalBias.tooLow, icon: '↓' },
    { label: 'Too Left', value: directionalBias.tooLeft, icon: '←' },
    { label: 'Too Right', value: directionalBias.tooRight, icon: '→' }
  ]
  const dominantBias = biasValues.reduce((max, curr) => 
    curr.value > max.value ? curr : max
  , biasValues[0])
  
  const totalBiasShots = biasValues.reduce((sum, b) => sum + b.value, 0)
  
  return (
    <div className="shot-tendency-card">
      <div className="shot-tendency-card__header">
        <h3 className="shot-tendency-card__title">{targetDisplayName}</h3>
        <div className="shot-tendency-card__accuracy">
          <span className="shot-tendency-card__hitrate">{hitRate.toFixed(1)}%</span>
          <span className="shot-tendency-card__attempts">{hits}/{attempts} hits</span>
        </div>
      </div>
      
      {attempts - hits > 0 && (
        <>
          {/* Directional Bias Section */}
          {totalBiasShots > 0 && (
            <div className="shot-tendency-card__section">
              <h4 className="shot-tendency-card__section-title">Directional Tendency</h4>
              <div className="shot-tendency-card__bias-grid">
                {biasValues.map(bias => (
                  <div 
                    key={bias.label}
                    className={`shot-tendency-card__bias-item ${
                      bias.value === dominantBias.value && bias.value > 0 
                        ? 'shot-tendency-card__bias-item--dominant' 
                        : ''
                    }`}
                  >
                    <span className="shot-tendency-card__bias-icon">{bias.icon}</span>
                    <span className="shot-tendency-card__bias-label">{bias.label}</span>
                    <span className="shot-tendency-card__bias-value">{bias.value}</span>
                  </div>
                ))}
              </div>
              {dominantBias.value > 0 && (
                <p className="shot-tendency-card__bias-summary">
                  Most common miss: <strong>{dominantBias.label}</strong> ({dominantBias.value} times)
                </p>
              )}
            </div>
          )}
          
          {/* Common Misses Section */}
          {commonMisses.length > 0 && (
            <div className="shot-tendency-card__section">
              <h4 className="shot-tendency-card__section-title">Where Your Misses Land</h4>
              <div className="shot-tendency-card__misses">
                {commonMisses.map((miss, idx) => (
                  <div key={idx} className="shot-tendency-card__miss-item">
                    <div className="shot-tendency-card__miss-rank">{idx + 1}</div>
                    <div className="shot-tendency-card__miss-details">
                      <span className="shot-tendency-card__miss-name">{miss.displayName}</span>
                      <span className="shot-tendency-card__miss-stats">
                        {miss.count} times ({miss.percentage.toFixed(1)}% of misses)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {attempts === hits && (
        <p className="shot-tendency-card__perfect">
          🎯 Perfect accuracy! Keep up the great shooting!
        </p>
      )}
    </div>
  )
}
