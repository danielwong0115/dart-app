import type { FC, MouseEvent } from 'react'
import type { End, Shot } from '../../utils/types'
import { Dartboard } from '../Dartboard'
import { UndoButton } from '../UndoButton'

interface RecordPageProps {
  canUndoShot: boolean
  onUndoShot: () => void
  undoIcon: FC
  currentRound: End[]
  currentEndIndex: number
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  shotsInCurrentEnd: Shot[]
  shotsPerEnd: number
  onPrimaryActionClick: () => void
  primaryActionDisabled: boolean
  primaryActionLabel: string
  practiceNotes: string
  onPracticeNotesChange: (value: string) => void
}

export const RecordPage: FC<RecordPageProps> = ({
  canUndoShot,
  onUndoShot,
  undoIcon: UndoIcon,
  currentRound,
  currentEndIndex,
  onTargetClick,
  shotsInCurrentEnd,
  shotsPerEnd,
  onPrimaryActionClick,
  primaryActionDisabled,
  primaryActionLabel,
  practiceNotes,
  onPracticeNotesChange,
}) => {
  const totalScore = currentRound[0]?.shots.reduce((sum, shot) => sum + shot.score, 0) ?? 0
  
  return (
    <div className="record-page">
      <div className="record-panel">
        <UndoButton canUndo={canUndoShot} onUndo={onUndoShot} icon={UndoIcon} />

        <p className="record-instructions">Tap the dartboard to place your dart. Tap outside for a miss.</p>

        <Dartboard
          currentRound={currentRound}
          currentEndIndex={currentEndIndex}
          activeShot={null}
          onTargetClick={onTargetClick}
        />

        <div className="record-summary">
          <p className="record-summary__title">Current Score: {totalScore}</p>
          <p className="record-summary__text">Darts thrown: {shotsInCurrentEnd.length} / {shotsPerEnd}</p>
        </div>

        <div className="record-panel__actions">
          <button className="primary-button" onClick={onPrimaryActionClick} disabled={primaryActionDisabled}>
            {primaryActionLabel}
          </button>
        </div>

        <div className="record-notes">
          <label htmlFor="practice-notes" className="record-notes__label">
            Practice Notes (Optional)
          </label>
          <textarea
            id="practice-notes"
            className="record-notes__textarea"
            placeholder="Add notes about this game session..."
            value={practiceNotes}
            onChange={event => onPracticeNotesChange(event.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

