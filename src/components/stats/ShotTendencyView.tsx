import { useState, type FC } from 'react'
import type { Game, ReleaseTimingEntry, ReleaseTimingData } from '../../utils/types'
import { analyzeShotTendencies } from '../../utils/shotTendencyAnalysis'
import { ShotTendencyCard } from './ShotTendencyCard'
import { ShotTendencyDartboard } from './ShotTendencyDartboard'
import { MicrobitUpload } from './MicrobitUpload'
import { ReleaseTimingStats } from './ReleaseTimingStats'

interface ShotTendencyViewProps {
  games: Game[]
}

export const ShotTendencyView: FC<ShotTendencyViewProps> = ({ games }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [releaseTimingData, setReleaseTimingData] = useState<ReleaseTimingData | null>(null)
  const tendencies = analyzeShotTendencies(games)
  
  const handleCSVUpload = (entries: ReleaseTimingEntry[]) => {
    setReleaseTimingData({
      entries,
      uploadedAt: new Date().toISOString()
    })
  }
  
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

      {/* Microbit Release Timing Section */}
      <div className="shot-tendency-view__release-section">
        <div className="shot-tendency-view__release-header">
          <h3 className="shot-tendency-view__release-title">Microbit Release Timing Analysis</h3>
          <p className="shot-tendency-view__release-description">
            Upload CSV data from your Microbit device to analyze your dart release timing patterns
          </p>
        </div>
        
        <MicrobitUpload onUpload={handleCSVUpload} />
        
        <ReleaseTimingStats releaseData={releaseTimingData} />
      </div>
    </div>
  )
}
