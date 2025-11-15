import type { FC } from 'react'

interface GameModeSelectionProps {
  onSelectCompetition: () => void
  onSelectTraining: () => void
}

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

const DartboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
)

export const GameModeSelection: FC<GameModeSelectionProps> = ({ onSelectCompetition, onSelectTraining }) => {
  return (
    <div className="game-mode-selection">
      <h2 className="game-mode-selection__title">Select Game Mode</h2>
      <div className="game-mode-selection__buttons">
        <button className="game-mode-button" onClick={onSelectCompetition}>
          <TrophyIcon />
          <span className="game-mode-button__label">Competition</span>
        </button>
        <button className="game-mode-button" onClick={onSelectTraining}>
          <DartboardIcon />
          <span className="game-mode-button__label">Training</span>
        </button>
      </div>
    </div>
  )
}
