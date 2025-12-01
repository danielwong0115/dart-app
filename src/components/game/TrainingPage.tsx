import type { FC, MouseEvent } from 'react'
import type { Shot } from '../../utils/types'
import { Dartboard } from '../Dartboard'
import { UndoButton } from '../UndoButton'

interface TargetSpot {
  type: 'single' | 'double' | 'triple' | 'bullseye' | 'outer-bull'
  number: number // 1-20 for regular spots, 25 for outer bull, 50 for bullseye
  displayName: string
}

interface TrainingPageProps {
  canUndoShot: boolean
  onUndoShot: () => void
  undoIcon: FC
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  currentSpotShots: Shot[]
  totalScore: number
  currentTarget: TargetSpot
  attemptsLeft: number
  onEndTraining: () => void
  spotsCompleted: number
  maxSpots: number
}

export const TrainingPage: FC<TrainingPageProps> = ({
  canUndoShot,
  onUndoShot,
  undoIcon: UndoIcon,
  onTargetClick,
  currentSpotShots,
  totalScore,
  currentTarget,
  attemptsLeft,
  onEndTraining,
  spotsCompleted,
  maxSpots,
}) => {
  // Create dartboard display data for current target attempts
  const currentRound = [{
    shots: currentSpotShots,
    endScore: 0,
    precision: 0
  }]

  return (
    <div className="training-page">
      <div className="training-panel">
        <UndoButton canUndo={canUndoShot} onUndo={onUndoShot} icon={UndoIcon} />

        <div className="training-score">
          <div className="training-score__total">
            <span className="training-score__label">Total Score</span>
            <span className="training-score__value">{totalScore}</span>
          </div>
          <div className="training-score__spots">
            <span className="training-score__spots-label">Targets Remaining: {maxSpots - spotsCompleted}</span>
          </div>
        </div>

        <div className="training-target">
          <p className="training-target__label">Hit the target:</p>
          <p className="training-target__name">{currentTarget.displayName}</p>
          <p className="training-target__attempts">Attempts left: {attemptsLeft} / 3</p>
        </div>

        <p className="record-instructions">
          Tap the dartboard where you hit. Hit the target on your first try for maximum points!
        </p>

        <Dartboard
          currentRound={currentRound}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={onTargetClick}
        />

        <div className="training-scoring">
          <p className="training-scoring__title">Scoring</p>
          <div className="training-scoring__list">
            <div className="training-scoring__item">
              <span className="training-scoring__attempt">1st attempt</span>
              <span className="training-scoring__points">Full points</span>
            </div>
            <div className="training-scoring__item">
              <span className="training-scoring__attempt">2nd attempt</span>
              <span className="training-scoring__points">Half points</span>
            </div>
            <div className="training-scoring__item">
              <span className="training-scoring__attempt">3rd attempt</span>
              <span className="training-scoring__points">Quarter points</span>
            </div>
          </div>
        </div>

        <div className="record-panel__actions">
          <button className="primary-button" onClick={onEndTraining}>
            End Session Early
          </button>
        </div>
      </div>
    </div>
  )
}
