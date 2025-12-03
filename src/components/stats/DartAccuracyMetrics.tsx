import type { Game } from '../../utils/types'

interface DartAccuracyMetricsProps {
  games: Game[]
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

export const DartAccuracyMetrics = ({ games }: DartAccuracyMetricsProps) => {
  // Filter only training games with accuracy data
  const trainingGames = games.filter(game => 
    game.gameMode === 'training' && game.trainingAccuracy
  )

  if (trainingGames.length === 0) {
    return (
      <div className="stats-aggregate__summary">
        <div className="stats-aggregate__summary-card">
          <span className="stats-aggregate__summary-text">
            No training data available. Complete training sessions to see accuracy metrics.
          </span>
        </div>
      </div>
    )
  }

  // Calculate overall accuracy
  let totalAttempts = 0
  let totalHits = 0
  let singleAttempts = 0
  let singleHits = 0
  let doubleAttempts = 0
  let doubleHits = 0
  let tripleAttempts = 0
  let tripleHits = 0

  for (const game of trainingGames) {
    if (!game.trainingAccuracy) continue

    for (const [sectionKey, accuracy] of Object.entries(game.trainingAccuracy.sections)) {
      totalAttempts += accuracy.attempts
      totalHits += accuracy.hits

      const [type] = sectionKey.split('-')
      
      if (type === 'single') {
        singleAttempts += accuracy.attempts
        singleHits += accuracy.hits
      } else if (type === 'double') {
        doubleAttempts += accuracy.attempts
        doubleHits += accuracy.hits
      } else if (type === 'triple') {
        tripleAttempts += accuracy.attempts
        tripleHits += accuracy.hits
      }
    }
  }

  const overallAccuracy = totalAttempts > 0 ? (totalHits / totalAttempts) * 100 : 0
  const singleAccuracy = singleAttempts > 0 ? (singleHits / singleAttempts) * 100 : 0
  const doubleAccuracy = doubleAttempts > 0 ? (doubleHits / doubleAttempts) * 100 : 0
  const tripleAccuracy = tripleAttempts > 0 ? (tripleHits / tripleAttempts) * 100 : 0

  return (
    <>
      <div className="stats-aggregate__summary">
        <div className="stats-aggregate__summary-card">
          <span className="stats-aggregate__summary-text">
            Analyzing <span className="stats-aggregate__summary-number">{trainingGames.length}</span> training {trainingGames.length === 1 ? 'session' : 'sessions'} with <span className="stats-aggregate__summary-number">{totalAttempts}</span> dart throws
          </span>
        </div>
      </div>

      <div className="stats-grid stats-grid--paired">
        <div className="stats-card stats-card--with-badge">
          <span className="stats-card__badge">Overall</span>
          <span className="stats-card__label">Total Accuracy</span>
          <span className="stats-card__value">{formatPercentage(overallAccuracy)}</span>
          <span className="stats-card__sublabel">{totalHits} / {totalAttempts} hits</span>
        </div>
        <div className="stats-card stats-card--with-badge">
          <span className="stats-card__badge">Singles</span>
          <span className="stats-card__label">Single Accuracy</span>
          <span className="stats-card__value">{formatPercentage(singleAccuracy)}</span>
          <span className="stats-card__sublabel">{singleHits} / {singleAttempts} hits</span>
        </div>
      </div>

      <div className="stats-grid stats-grid--paired">
        <div className="stats-card stats-card--with-badge">
          <span className="stats-card__badge">Doubles</span>
          <span className="stats-card__label">Double Accuracy</span>
          <span className="stats-card__value">{formatPercentage(doubleAccuracy)}</span>
          <span className="stats-card__sublabel">{doubleHits} / {doubleAttempts} hits</span>
        </div>
        <div className="stats-card stats-card--with-badge">
          <span className="stats-card__badge">Triples</span>
          <span className="stats-card__label">Triple Accuracy</span>
          <span className="stats-card__value">{formatPercentage(tripleAccuracy)}</span>
          <span className="stats-card__sublabel">{tripleHits} / {tripleAttempts} hits</span>
        </div>
      </div>
    </>
  )
}
