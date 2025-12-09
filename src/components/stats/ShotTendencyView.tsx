import { useState, type FC } from 'react'
import type { Game } from '../../utils/types'
import { analyzeShotTendencies } from '../../utils/shotTendencyAnalysis'
import { ShotTendencyCard } from './ShotTendencyCard'
import { ShotTendencyDartboard } from './ShotTendencyDartboard'

interface ShotTendencyViewProps {
  games: Game[]
}

export const ShotTendencyView: FC<ShotTendencyViewProps> = ({ games }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const tendencies = analyzeShotTendencies(games)
  
  if (tendencies.length === 0) {
    return (
      <div className="shot-tendency-empty">
        <p>No shot tendency data yet. Complete some training sessions to see your shooting patterns!</p>
      </div>
    )
  }
  
  const selectedTendency = selectedSection 
    ? tendencies.find(t => t.targetSection === selectedSection)
    : null
  
  return (
    <div className="shot-tendency-view">
      <div className="shot-tendency-view__header">
        <h2 className="shot-tendency-view__title">Shot Tendency Analysis</h2>
        <p className="shot-tendency-view__description">
          Click on a dartboard section to see where your darts land when you miss that target.
        </p>
      </div>
      
      <ShotTendencyDartboard
        tendencies={tendencies}
        selectedSection={selectedSection}
        onSectionClick={setSelectedSection}
      />
      
      {selectedTendency && (
        <div className="shot-tendency-view__detail">
          <ShotTendencyCard tendency={selectedTendency} />
        </div>
      )}
      
      {selectedSection && !selectedTendency && (
        <div className="shot-tendency-view__no-data">
          <p>No training data yet for this target. Practice this spot to see your shooting patterns!</p>
        </div>
      )}
    </div>
  )
}
