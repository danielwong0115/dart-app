import { useEffect, useMemo, useState } from 'react'
import type { Round, Game } from '../utils/types'
import { calculateAverage } from '../utils/helpers'
import { updateRoundNotesInFirestore } from '../utils/firestore'
import { StatsTabs, type StatsTab } from './stats/StatsTabs'
import { AggregateControls } from './stats/AggregateControls'
import { DartAccuracyMetrics } from './stats/DartAccuracyMetrics'
import { PracticeList, type PracticeEntry } from './stats/PracticeList'
import { DeletePracticeModal } from './stats/DeletePracticeModal'
import { AccuracyDartboard } from './stats/AccuracyDartboard'
import { AccuracyTimelineChart } from './stats/AccuracyTimelineChart'
import { TrainingAccuracyChart } from './stats/TrainingAccuracyChart'
import { ShotTendencyView } from './stats/ShotTendencyView'

interface StatsViewProps {
  rounds: Round[]
  userId: string
  onDeleteRound: (roundId: string) => Promise<void>
  games?: Game[] // Original games with training accuracy data
}

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const exportToCSV = (rounds: Round[]) => {
  const sortedRounds = [...rounds].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )

  const headers = [
    'Practice Number',
    'Date',
    'Total Score',
    'Number of Ends',
    'Average Score per End',
    'Best End',
    'Average Precision',
    'Notes',
  ]

  const rows = sortedRounds.map((round, index) => {
    const practiceNumber = sortedRounds.length - index
    const date = formatDate(round.createdAt)
    const totalScore = round.totalScore
    const numberOfEnds = round.ends.length
    const averagePerEnd = numberOfEnds > 0 ? (totalScore / numberOfEnds).toFixed(2) : '0.00'
    const bestEnd = round.ends.length > 0 ? Math.max(...round.ends.map(end => end.endScore)) : 0
    const precisions = round.ends.map(end => end.precision).filter(value => value > 0)
    const averagePrecision = precisions.length > 0 ? calculateAverage(precisions).toFixed(2) : 'N/A'
    const rawNotes = round.notes ?? ''
    const escapedNotes = rawNotes.replace(/"/g, '""')

    return [
      practiceNumber,
      `"${date}"`,
      totalScore,
      numberOfEnds,
      averagePerEnd,
      bestEnd,
      averagePrecision,
      rawNotes ? `"${escapedNotes}"` : '',
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `artemis-practice-stats-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const StatsView = ({ rounds, userId, onDeleteRound, games = [] }: StatsViewProps) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('history')
  const [range, setRange] = useState(5)
  const [rangeInput, setRangeInput] = useState('5')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const sortedRounds = useMemo(
    () => [...rounds].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [rounds],
  )

  useEffect(() => {
    const maxRange = Math.max(1, sortedRounds.length || 1)
    if (range > maxRange) {
      setRange(maxRange)
      setRangeInput(String(maxRange))
    }
  }, [range, sortedRounds.length])

  const clampRange = (value: number) => Math.max(1, Math.floor(value))

  const handleRangeInputChange = (value: string) => {
    setRangeInput(value)

    if (value === '') {
      return
    }

    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }

    const clamped = clampRange(parsed)
    setRange(clamped)
  }

  const handleRangeInputBlur = () => {
    if (rangeInput === '') {
      setRangeInput(String(range))
      return
    }

    const parsed = Number(rangeInput)
    if (Number.isNaN(parsed)) {
      setRangeInput(String(range))
      return
    }

    const clamped = clampRange(parsed)
    setRange(clamped)
    setRangeInput(String(clamped))
  }

  const effectiveRange = Math.max(1, Math.min(range, sortedRounds.length || 1))

  const selectedRounds = useMemo(
    () => sortedRounds.slice(0, activeTab === 'aggregate' ? effectiveRange : sortedRounds.length),
    [sortedRounds, activeTab, effectiveRange],
  )

  const practiceNumberLookup = useMemo(() => {
    const lookup = new Map<string, number>()
    sortedRounds.forEach((round, index) => {
      lookup.set(round.id, sortedRounds.length - index)
    })
    return lookup
  }, [sortedRounds])

  const historyEntries: PracticeEntry[] = useMemo(
    () => selectedRounds.map((round, index) => {
      // Find corresponding game by ID
      const game = games.find(g => g.id === round.id)
      return {
        round,
        practiceNumber: practiceNumberLookup.get(round.id) ?? (selectedRounds.length - index),
        formattedDate: formatDate(round.createdAt),
        game,
      }
    }),
    [selectedRounds, practiceNumberLookup, games],
  )

  const handleTabChange = (tab: StatsTab) => {
    setActiveTab(tab)
  }

  const handleRequestDelete = (roundId: string) => {
    if (isDeleting) {
      return
    }
    setPendingDeleteId(roundId)
    setDeleteError(null)
  }

  const handleCancelDelete = () => {
    if (isDeleting) {
      return
    }
    setPendingDeleteId(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onDeleteRound(pendingDeleteId)
      setPendingDeleteId(null)
    } catch (error) {
      console.error('Failed to delete practice:', error)
      setDeleteError('Failed to delete this practice. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveNotes = async (roundId: string, notes: string) => {
    await updateRoundNotesInFirestore(userId, roundId, notes)
  }

  const handleSectionClick = (section: string) => {
    if (selectedSection === section) {
      setSelectedSection(null) // Deselect if clicking the same section
    } else {
      setSelectedSection(section)
    }
  }

  const pendingDeleteRound = useMemo(
    () => (pendingDeleteId ? sortedRounds.find(round => round.id === pendingDeleteId) ?? null : null),
    [pendingDeleteId, sortedRounds],
  )

  const pendingPracticeNumber = useMemo(() => {
    if (!pendingDeleteRound) {
      return null
    }

    const roundIndex = sortedRounds.findIndex(round => round.id === pendingDeleteRound.id)
    if (roundIndex === -1) {
      return null
    }

    return sortedRounds.length - roundIndex
  }, [pendingDeleteRound, sortedRounds])

  if (rounds.length === 0) {
    return (
      <div className="stats-container">
        <div className="stats-empty">No practices recorded yet. Add your first practice to see your progress.</div>
      </div>
    )
  }

  // Check if we have any training games for dartboard view
  const hasTrainingData = games.some(game => game.gameMode === 'training' && game.trainingAccuracy)

  return (
    <div className="stats-container">
      <div className="stats-header">
        <StatsTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === 'aggregate' ? (
        <div className="stats-aggregate">
          {/* Dartboard Accuracy Section - Always show at top */}
          {hasTrainingData && (
            <div className="stats-dartboard-section">
              <h2 className="stats-section-title">Training Accuracy by Target</h2>
              <AccuracyDartboard 
                games={games}
                selectedSection={selectedSection}
                onSectionClick={handleSectionClick}
              />
              
              {selectedSection && (
                <div className="stats-timeline-section">
                  <AccuracyTimelineChart 
                    games={games}
                    selectedSection={selectedSection}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Dart-specific aggregate metrics */}
          <div className="stats-aggregate-legacy">
            <AggregateControls
              rangeInput={rangeInput}
              onRangeInputChange={handleRangeInputChange}
              onRangeInputBlur={handleRangeInputBlur}
            />

            <DartAccuracyMetrics games={games} />
          </div>
        </div>
      ) : activeTab === 'tendency' ? (
        <ShotTendencyView games={games} />
      ) : (
        <div className="stats-history">
          <TrainingAccuracyChart games={games} />

          <div className="stats-chart__actions">
            <button
              className="stats-export-button"
              onClick={() => exportToCSV(rounds)}
              type="button"
              disabled={rounds.length === 0}
              aria-label="Export statistics to CSV"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>

          <PracticeList
            entries={historyEntries}
            onRequestDelete={handleRequestDelete}
            onSaveNotes={handleSaveNotes}
            pendingDeleteId={pendingDeleteId}
            isDeleting={isDeleting}
          />
        </div>
      )}

      {pendingDeleteRound && (
        <DeletePracticeModal
          titleId="delete-practice-title"
          descriptionId="delete-practice-description"
          practiceNumber={pendingPracticeNumber}
          practiceDate={formatDate(pendingDeleteRound.createdAt)}
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
