import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { View, Shot, End, Game, Turn } from './utils/types'
import type { PracticeCardProps } from './components/home/PracticeCard'
import { SHOTS_PER_GAME } from './utils/constants'
import { generateEndTemplate, calculateScore } from './utils/helpers'
import { StatsView } from './components/StatsView'
import { HomeHeader } from './components/home/HomeHeader'
import { PracticeList } from './components/home/PracticeList'
import { PracticePlaceholder } from './components/home/PracticePlaceholder'
import { RecordPage } from './components/record/RecordPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { SignInView } from './components/auth/SignInView'
import { BottomNav } from './components/navigation/BottomNav'
import { GameModeSelection } from './components/game/GameModeSelection'
import { CompetitionPage } from './components/game/CompetitionPage'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { saveGameToFirestore, loadGamesFromFirestore, deleteGameFromFirestore } from './utils/firestore'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M9 21v-6h6v6" />
  </svg>
)

const GameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
)

const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19h16" />
    <path d="M8 19V9" />
    <path d="M12 19V5" />
    <path d="M16 19v-7" />
  </svg>
)

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </svg>
)

const App = () => {
  const [view, setView] = useState<View>('home')
  const [currentEndIndex] = useState(0) // Always 0 for single game
  const [currentRound, setCurrentRound] = useState<End[]>(() => [generateEndTemplate()])
  const [games, setGames] = useState<Game[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [practiceNotes, setPracticeNotes] = useState('')
  
  // Competition mode state
  const [competitionScore, setCompetitionScore] = useState(501)
  const [competitionTurns, setCompetitionTurns] = useState<Turn[]>([])
  const [currentTurnShots, setCurrentTurnShots] = useState<Shot[]>([])
  const [allCompetitionShots, setAllCompetitionShots] = useState<Shot[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current)

      // Load games from Firestore when user signs in
      if (current) {
        setIsLoadingGames(true)
        try {
          const firestoreGames = await loadGamesFromFirestore(current.uid)
          setGames(firestoreGames)
        } catch (error) {
          console.error('Failed to load games from Firestore:', error)
        } finally {
          setIsLoadingGames(false)
        }
      } else {
        // Clear games when user signs out
        setGames([])
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Sign-in failed', err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setView('home')
    } catch (err) {
      console.error('Sign-out failed', err)
    }
  }

  const resetGameState = () => {
    setCurrentRound([generateEndTemplate()])
    setPracticeNotes('')
  }

  const resetCompetitionState = () => {
    setCompetitionScore(501)
    setCompetitionTurns([])
    setCurrentTurnShots([])
    setAllCompetitionShots([])
    setPracticeNotes('')
  }

  // Reset game state when entering training view
  useEffect(() => {
    if (view === 'training') {
      resetGameState()
    }
  }, [view])

  // Reset competition state when entering competition view
  useEffect(() => {
    if (view === 'competition') {
      resetCompetitionState()
    }
  }, [view])

  const updateGameWithShot = (shot: Shot) => {
    setCurrentRound(prev => {
      const updated = [...prev]
      const end = updated[0]
      if (!end) return prev

      const shots = [...end.shots, shot].slice(0, SHOTS_PER_GAME)
      const endScore = shots.reduce((total, s) => total + s.score, 0)
      updated[0] = { shots, endScore, precision: 0 }
      return updated
    })
  }

  const handleTargetClick = (event: MouseEvent<HTMLDivElement>) => {
    const currentEnd = currentRound[0]
    if (!currentEnd || currentEnd.shots.length >= SHOTS_PER_GAME) {
      return
    }
    const wrapper = event.currentTarget
    const rect = wrapper.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const clickX = event.clientX - centerX
    const clickY = event.clientY - centerY

    // Use wrapper size for radius calculation
    const wrapperRadius = rect.width / 2

    // Normalize to dartboard size (values > 1 or < -1 are outside dartboard)
    const normalizedX = clickX / wrapperRadius
    const normalizedY = clickY / wrapperRadius

    // Calculate score based on dartboard rules
    const score = calculateScore(normalizedX, normalizedY)
    const shot: Shot = {
      x: normalizedX,
      y: normalizedY,
      score,
    }

    // Immediately add the shot
    updateGameWithShot(shot)
  }

  const handleUndoShot = () => {
    const currentEnd = currentRound[0]
    if (!currentEnd || currentEnd.shots.length === 0) return

    setCurrentRound(prev => {
      const updated = [...prev]
      const end = updated[0]
      if (!end) return prev

      const shots = end.shots.slice(0, -1) // Remove last shot
      const endScore = shots.reduce((total, s) => total + s.score, 0)
      updated[0] = { shots, endScore, precision: 0 }
      return updated
    })
  }

  const handleCompetitionTargetClick = (event: MouseEvent<HTMLDivElement>) => {
    if (competitionScore === 0 || currentTurnShots.length >= 3) {
      return
    }

    const wrapper = event.currentTarget
    const rect = wrapper.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const clickX = event.clientX - centerX
    const clickY = event.clientY - centerY
    const wrapperRadius = rect.width / 2
    const normalizedX = clickX / wrapperRadius
    const normalizedY = clickY / wrapperRadius
    const score = calculateScore(normalizedX, normalizedY)
    
    const shot: Shot = {
      x: normalizedX,
      y: normalizedY,
      score,
    }

    // Calculate what the score would be after this shot
    const currentTurnScore = currentTurnShots.reduce((sum, s) => sum + s.score, 0) + score
    const potentialNewScore = competitionScore - score
    
    // Add shot to current turn (don't finalize yet)
    const updatedTurnShots = [...currentTurnShots, shot]
    setCurrentTurnShots(updatedTurnShots)
    setAllCompetitionShots(prev => [...prev, shot])

    // Check if game is won
    if (potentialNewScore === 0) {
      // Game won! Auto-confirm this winning turn
      setCompetitionScore(0)
      const finalTurn: Turn = {
        shots: updatedTurnShots,
        turnScore: currentTurnScore,
      }
      setCompetitionTurns(prev => [...prev, finalTurn])
      setCurrentTurnShots([])
      return
    }
    
    // Check if this would go below 0 (bust) - don't update score yet, let them confirm
  }

  const handleConfirmTurn = () => {
    if (currentTurnShots.length === 0) return

    const currentTurnScore = currentTurnShots.reduce((sum, s) => sum + s.score, 0)
    const potentialNewScore = competitionScore - currentTurnScore

    // Check if this would be a bust
    if (potentialNewScore < 0) {
      // Bust - turn ends, score doesn't change, mark as bust
      const bustTurn: Turn = {
        shots: currentTurnShots,
        turnScore: 0,
        isBust: true,
      }
      setCompetitionTurns(prev => [...prev, bustTurn])
      setCurrentTurnShots([])
      // Score stays the same (bust doesn't reduce score)
      return
    }

    // Valid turn - apply the score
    setCompetitionScore(potentialNewScore)
    const newTurn: Turn = {
      shots: currentTurnShots,
      turnScore: currentTurnScore,
    }
    setCompetitionTurns(prev => [...prev, newTurn])
    setCurrentTurnShots([])
  }

  const handleCompetitionUndoShot = () => {
    if (competitionScore === 0) return // Can't undo after winning
    if (currentTurnShots.length === 0) return // Can only undo current turn shots

    // Only undo from current turn (not from previous turns)
    const lastShot = currentTurnShots[currentTurnShots.length - 1]
    if (lastShot) {
      setCurrentTurnShots(prev => prev.slice(0, -1))
      setAllCompetitionShots(prev => prev.slice(0, -1))
    }
  }

  // No need for handleConfirmEnd in single session darts game

  const currentEnd = currentRound[0]
  const shotsInCurrentEnd = currentEnd?.shots ?? []

  const isGameComplete = shotsInCurrentEnd.length === SHOTS_PER_GAME
  const canUndoShot = shotsInCurrentEnd.length > 0

  const handleSaveGame = async () => {
    if (!isGameComplete || !user) return
    const shots = currentRound[0]?.shots ?? []
    const totalScore = shots.reduce((total, shot) => shot.score + total, 0)
    const game: Game = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      shots,
      totalScore,
      notes: practiceNotes || undefined,
      gameMode: 'training',
    }

    // Save to Firestore first
    try {
      await saveGameToFirestore(user.uid, game)
      // Only update local state after successful save
      setGames(prev => [game, ...prev])
      resetGameState()
      setView('home')
    } catch (error) {
      console.error('Failed to save game:', error)
      alert('Failed to save your game session. Please try again.')
    }
  }

  const handleSaveCompetitionGame = async () => {
    if (competitionScore !== 0 || !user) return

    // Include any shots in the current turn (shouldn't happen when score is 0, but just in case)
    const allTurns = [...competitionTurns]
    if (currentTurnShots.length > 0) {
      allTurns.push({
        shots: currentTurnShots,
        turnScore: currentTurnShots.reduce((sum, s) => sum + s.score, 0),
      })
    }

    const game: Game = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      shots: allCompetitionShots,
      totalScore: 501, // They achieved 501 points
      notes: practiceNotes || undefined,
      gameMode: 'competition',
      turns: allTurns,
      startingScore: 501,
    }

    // Save to Firestore
    try {
      await saveGameToFirestore(user.uid, game)
      setGames(prev => [game, ...prev])
      resetCompetitionState()
      setView('home')
    } catch (error) {
      console.error('Failed to save competition game:', error)
      alert('Failed to save your game. Please try again.')
    }
  }

  const primaryActionLabel = 'Save Game'
  const primaryActionDisabled = !isGameComplete
  const handlePrimaryActionClick = handleSaveGame

  const handleDeleteGame = async (gameId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      await deleteGameFromFirestore(user.uid, gameId)
      setGames(prev => prev.filter(game => game.id !== gameId))
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw error instanceof Error ? error : new Error('Failed to delete game')
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // No need for ends configuration in single-session darts

  const userInitials = useMemo(() => {
    if (user?.displayName) {
      return user.displayName
        .trim()
        .split(/\s+/)
        .map(part => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AR'
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'AR'
  }, [user])

  const userDisplayName = user?.displayName || user?.email || 'Darts Player'

  const orderedGames = useMemo(
    () =>
      [...games].sort(
        (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      ),
    [games],
  )
  const gameOrderMap = useMemo(() => {
    const chronological = [...games].sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
    )
    return new Map(chronological.map((game, index) => [game.id, index + 1]))
  }, [games])

  const practiceCards = useMemo<PracticeCardProps[]>(() => {
    return orderedGames.map((game, index) => {
      const dartCount = game.shots.length
      const bestShot = game.shots.length > 0 ? Math.max(...game.shots.map(shot => shot.score)) : 0
      const averagePerDart = dartCount > 0 ? (game.totalScore / dartCount).toFixed(1) : '0.0'
      const gameNumber = gameOrderMap.get(game.id) ?? orderedGames.length - index
      const relativeLabel = formatDate(game.createdAt)
      const gameLabel = relativeLabel === 'Today' ? `Game #${gameNumber}` : relativeLabel
      const dartsLabel = dartCount === 1 ? '1 dart' : `${dartCount} darts`

      return {
        id: game.id,
        date: formatFullDate(game.createdAt),
        details: `${gameLabel} · ${formatTime(game.createdAt)} · ${dartsLabel}`,
        totalScore: game.totalScore,
        averagePerEnd: averagePerDart,
        bestEnd: bestShot,
        notes: game.notes,
      }
    })
  }, [orderedGames, gameOrderMap])

  const homeView = (
    <div className="home-page">
      <HomeHeader onRecordNewPractice={() => setView('game')} />

      {isLoadingGames ? (
        <PracticePlaceholder title="Loading your sessions…" />
      ) : practiceCards.length === 0 ? (
        <PracticePlaceholder title="No game sessions yet" subtitle={'Tap "Record New Practice" to get started.'} />
      ) : (
        <PracticeList cards={practiceCards} />
      )}
    </div>
  )

  const gameModeView = (
    <GameModeSelection
      onSelectCompetition={() => setView('competition')}
      onSelectTraining={() => setView('training')}
    />
  )

  // Calculate if player can confirm turn
  const currentTurnScore = currentTurnShots.reduce((sum, s) => sum + s.score, 0)
  const potentialScoreAfterTurn = competitionScore - currentTurnScore
  const wouldBust = potentialScoreAfterTurn < 0
  const wouldWin = potentialScoreAfterTurn === 0
  const has3Darts = currentTurnShots.length === 3
  const canConfirmCompetitionTurn = currentTurnShots.length > 0 && (has3Darts || wouldBust || wouldWin)

  const competitionView = (
    <CompetitionPage
      canUndoShot={currentTurnShots.length > 0}
      onUndoShot={handleCompetitionUndoShot}
      undoIcon={UndoIcon}
      currentScore={competitionScore}
      onTargetClick={handleCompetitionTargetClick}
      currentTurnShots={currentTurnShots}
      turns={competitionTurns}
      onEndGame={handleSaveCompetitionGame}
      practiceNotes={practiceNotes}
      onPracticeNotesChange={setPracticeNotes}
      onConfirmTurn={handleConfirmTurn}
      currentTurnNumber={competitionTurns.length + 1}
      canConfirmTurn={canConfirmCompetitionTurn}
    />
  )

  const trainingView = (
    <RecordPage
      canUndoShot={canUndoShot}
      onUndoShot={handleUndoShot}
      undoIcon={UndoIcon}
      currentRound={currentRound}
      currentEndIndex={currentEndIndex}
      onTargetClick={handleTargetClick}
      shotsInCurrentEnd={shotsInCurrentEnd}
      shotsPerEnd={SHOTS_PER_GAME}
      onPrimaryActionClick={handlePrimaryActionClick}
      primaryActionDisabled={primaryActionDisabled}
      primaryActionLabel={primaryActionLabel}
      practiceNotes={practiceNotes}
      onPracticeNotesChange={setPracticeNotes}
    />
  )

  // Convert games to rounds format for StatsView compatibility
  const gamesAsRounds = useMemo(() => {
    return games.map(game => ({
      id: game.id,
      createdAt: game.createdAt,
      ends: [{
        shots: game.shots,
        endScore: game.totalScore,
        precision: 0
      }],
      totalScore: game.totalScore,
      notes: game.notes
    }))
  }, [games])

  const statsView = (
    <div className="stats-page">
      <StatsView rounds={gamesAsRounds} userId={user?.uid ?? ''} onDeleteRound={handleDeleteGame} />
    </div>
  )

  const profileView = (
    <ProfilePage
      initials={userInitials}
      displayName={userDisplayName}
      email={user?.email}
      onSignOut={handleSignOut}
    />
  )

  const renderActiveView = () => {
    switch (view) {
      case 'home':
        return homeView
      case 'game':
        return gameModeView
      case 'competition':
        return competitionView
      case 'training':
        return trainingView
      case 'stats':
        return statsView
      case 'profile':
        return profileView
      default:
        return null
    }
  }

  const signInView = <SignInView onSignIn={handleSignIn} />

  if (!user) {
    return signInView
  }

  const navItems: Array<{ key: View; label: string; icon: ReactNode }> = [
    { key: 'home', label: 'Home', icon: <HomeIcon /> },
    { key: 'game', label: 'Game', icon: <GameIcon /> },
    { key: 'stats', label: 'Stats', icon: <StatsIcon /> },
    { key: 'profile', label: 'Profile', icon: <ProfileIcon /> },
  ]

  return (
    <div className="app-shell app-shell--authenticated">
      <header className="brand-header">
        <h1 className="brand-logo">Dartlet</h1>
        <div className="brand-underline" aria-hidden="true" />
      </header>
      <main className="app-main">
        {renderActiveView()}
      </main>
      <BottomNav items={navItems} activeKey={view} onSelect={setView} />
    </div>
  )
}

export default App
