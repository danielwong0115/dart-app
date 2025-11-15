import { useState, type FC, type MouseEvent } from 'react'
import type { Shot } from '../../utils/types'
import { Dartboard } from '../Dartboard'
import { UndoButton } from '../UndoButton'

interface Turn {
  shots: Shot[]
  turnScore: number
  isBust?: boolean
}

interface CompetitionPageProps {
  canUndoShot: boolean
  onUndoShot: () => void
  undoIcon: FC
  currentScore: number
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  currentTurnShots: Shot[]
  turns: Turn[]
  onEndGame: () => void
  practiceNotes: string
  onPracticeNotesChange: (value: string) => void
  onConfirmTurn: () => void
  currentTurnNumber: number
  canConfirmTurn: boolean
}

export const CompetitionPage: FC<CompetitionPageProps> = ({
  canUndoShot,
  onUndoShot,
  undoIcon: UndoIcon,
  currentScore,
  onTargetClick,
  currentTurnShots,
  turns,
  onEndGame,
  practiceNotes,
  onPracticeNotesChange,
  onConfirmTurn,
  currentTurnNumber,
  canConfirmTurn,
}) => {
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null)
  const isGameOver = currentScore === 0
  const shotsInCurrentTurn = currentTurnShots.length

  // Create dartboard display data
  // If game is over, show all non-busted turns color-coded
  // Otherwise, show current turn shots
  const currentRound = isGameOver
    ? turns
        .filter(turn => !turn.isBust)
        .map(turn => ({
          shots: turn.shots,
          endScore: turn.turnScore,
          precision: 0
        }))
    : [{
        shots: currentTurnShots,
        endScore: currentTurnShots.reduce((sum, shot) => sum + shot.score, 0),
        precision: 0
      }]

  return (
    <div className="competition-page">
      <div className="competition-panel">
        <UndoButton canUndo={canUndoShot && !isGameOver} onUndo={onUndoShot} icon={UndoIcon} />

        <div className="competition-score">
          <div className="competition-score__remaining">
            <span className="competition-score__label">Score Remaining</span>
            <span className="competition-score__value">{currentScore}</span>
          </div>
        </div>

        <p className="record-instructions">
          {isGameOver 
            ? 'Game Complete! You reached exactly 0!' 
            : 'Tap the dartboard to place your dart. Get to exactly 0 to win!'}
        </p>

        {isGameOver && (
          <div className="turn-legend">
            {turns
              .filter(turn => !turn.isBust)
              .map((_, index) => {
                const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e']
                const color = colors[index % 10]
                const isSelected = selectedTurnIndex === index
                return (
                  <div 
                    key={index} 
                    className={`turn-legend__item ${isSelected ? 'turn-legend__item--selected' : ''}`}
                    onClick={() => setSelectedTurnIndex(isSelected ? null : index)}
                  >
                    <div className="turn-legend__color" style={{ backgroundColor: color }} />
                    <span className="turn-legend__label">Turn {index + 1}</span>
                  </div>
                )
              })}
          </div>
        )}

        <Dartboard
          currentRound={currentRound}
          currentEndIndex={isGameOver ? currentRound.length - 1 : 0}
          activeShot={null}
          onTargetClick={isGameOver ? () => {} : onTargetClick}
          selectedEndIndex={selectedTurnIndex}
        />

        {isGameOver ? (
          <div className="competition-victory">
            <p className="competition-victory__text">🎯 You Won! 🎯</p>
          </div>
        ) : (
          <div className="record-summary">
            <p className="record-summary__title">Turn {currentTurnNumber}</p>
            <p className="record-summary__text">Darts in current turn: {shotsInCurrentTurn} / 3</p>
          </div>
        )}

        {!isGameOver && shotsInCurrentTurn > 0 && (
          <div className="record-panel__actions">
            <button className="primary-button" onClick={onConfirmTurn} disabled={!canConfirmTurn}>
              Confirm Turn
            </button>
          </div>
        )}

        {/* Display turn history */}
        <div className="turn-history">
          <p className="turn-history__title">Turn History</p>
          <div className="turn-history__list">
            {turns.map((turn, index) => (
              <div key={index} className="turn-card">
                <div className="turn-card__header">
                  <span className="turn-card__number">Turn {index + 1}</span>
                  <span className={`turn-card__score ${turn.isBust ? 'turn-card__score--bust' : ''}`}>
                    {turn.isBust ? 'Busted' : `-${turn.turnScore} points`}
                  </span>
                </div>
                <div className="turn-card__shots">
                  {turn.shots.map((shot, shotIndex) => (
                    <span key={shotIndex} className="turn-card__shot">
                      {shot.score}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isGameOver && (
          <>
            <div className="record-notes">
              <label htmlFor="practice-notes" className="record-notes__label">
                Game Notes (Optional)
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

            <div className="record-panel__actions">
              <button className="primary-button" onClick={onEndGame}>
                Save Game
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
