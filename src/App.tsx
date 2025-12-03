import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { View, Shot, Game, Turn, TrainingAccuracyData } from './utils/types'
import type { PracticeCardProps } from './components/home/PracticeCard'
import { calculateScore } from './utils/helpers'
import { StatsView } from './components/StatsView'
import { HomeHeader } from './components/home/HomeHeader'
import { PracticeList } from './components/home/PracticeList'
import { PracticePlaceholder } from './components/home/PracticePlaceholder'
import { ProfilePage } from './components/profile/ProfilePage'
import { SignInView } from './components/auth/SignInView'
import { BottomNav } from './components/navigation/BottomNav'
import { GameModeSelection } from './components/game/GameModeSelection'
import { CompetitionPage } from './components/game/CompetitionPage'
import { TrainingPage } from './components/game/TrainingPage'
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
  const [games, setGames] = useState<Game[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [practiceNotes, setPracticeNotes] = useState('')
  
  // Competition mode state
  const [competitionScore, setCompetitionScore] = useState(501)
  const [competitionTurns, setCompetitionTurns] = useState<Turn[]>([])
  const [currentTurnShots, setCurrentTurnShots] = useState<Shot[]>([])
  const [allCompetitionShots, setAllCompetitionShots] = useState<Shot[]>([])

  // Training mode state
  type TargetSpot = { type: 'single' | 'double' | 'triple' | 'bullseye' | 'outer-bull'; number: number; displayName: string }
  const [trainingScore, setTrainingScore] = useState(0)
  const [currentTarget, setCurrentTarget] = useState<TargetSpot | null>(null)
  const [currentSpotShots, setCurrentSpotShots] = useState<Shot[]>([])
  const [trainingAttemptsLeft, setTrainingAttemptsLeft] = useState(3)
  const [allTrainingShots, setAllTrainingShots] = useState<Shot[]>([])
  const [spotsCompleted, setSpotsCompleted] = useState(0)
  const TRAINING_MAX_SPOTS = 20
  const [trainingFeedback, setTrainingFeedback] = useState<{ message: string; type: 'hit' | 'miss' } | null>(null)
  const [trainingAccuracy, setTrainingAccuracy] = useState<TrainingAccuracyData>({ sections: {} })

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

  const resetCompetitionState = () => {
    setCompetitionScore(501)
    setCompetitionTurns([])
    setCurrentTurnShots([])
    setAllCompetitionShots([])
    setPracticeNotes('')
  }

  const generateRandomTarget = (): TargetSpot => {
    const types: Array<'single' | 'double' | 'triple' | 'bullseye' | 'outer-bull'> = [
      'single', 'single', 'single', 'double', 'double', 'triple', 'triple', 'bullseye', 'outer-bull'
    ]
    const type = types[Math.floor(Math.random() * types.length)]
    
    if (type === 'bullseye') {
      return { type: 'bullseye', number: 50, displayName: 'Bullseye' }
    }
    if (type === 'outer-bull') {
      return { type: 'outer-bull', number: 25, displayName: 'Outer Bull (25)' }
    }
    
    const number = Math.floor(Math.random() * 20) + 1
    const typeMap = { single: 'Single', double: 'Double', triple: 'Triple' }
    return { 
      type, 
      number, 
      displayName: `${typeMap[type]} ${number}` 
    }
  }

  const resetTrainingState = () => {
    setTrainingScore(0)
    setCurrentTarget(generateRandomTarget())
    setCurrentSpotShots([])
    setTrainingAttemptsLeft(3)
    setAllTrainingShots([])
    setSpotsCompleted(0)
    setPracticeNotes('')
    setTrainingFeedback(null)
    setTrainingAccuracy({ sections: {} })
  }

  // Reset game state when entering training view
  useEffect(() => {
    if (view === 'training') {
      resetTrainingState()
    }
  }, [view])

  // Reset competition state when entering competition view
  useEffect(() => {
    if (view === 'competition') {
      resetCompetitionState()
    }
  }, [view])



  const handleCompetitionTargetClick = (event: MouseEvent<HTMLDivElement>) => {
    if (competitionScore === 0 || currentTurnShots.length >= 3) {
      return
    }

    const wrapper = event.currentTarget
    const svg = wrapper.querySelector('svg')
    if (!svg) return
    
    // Get click position in SVG coordinates
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    
    // Convert SVG coordinates to normalized (-1 to 1) where dartboard center (50,50) maps to (0,0)
    const normalizedX = (svgP.x - 50) / 50
    const normalizedY = (svgP.y - 50) / 50
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

  const checkIfHitTarget = (shot: Shot, target: TargetSpot): boolean => {
    const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
    
    // Check bullseye
    if (target.type === 'bullseye') {
      return distance <= 0.05 // BULLSEYE_RADIUS
    }
    
    // Check outer bull
    if (target.type === 'outer-bull') {
      return distance > 0.05 && distance <= 0.12 // OUTER_BULL_RADIUS
    }
    
    // For miss
    if (distance > 1) return false
    
    // Calculate angle to determine segment (same logic as calculateScore)
    let angle = Math.atan2(shot.y, shot.x) * (180 / Math.PI)
    angle = (angle + 90 + 360) % 360 // Normalize to 0-360, with 0 at top
    
    // Each segment is 18 degrees (360 / 20)
    const segmentIndex = Math.floor(((angle + 9) % 360) / 18)
    const segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] // Clockwise from top
    const hitNumber = segments[segmentIndex]
    
    if (hitNumber !== target.number) return false
    
    // Check ring type
    if (distance <= 0.12) return false // Bull area
    
    // Check for triple ring (0.55 to 0.62)
    if (distance >= 0.55 && distance <= 0.62) {
      return target.type === 'triple'
    }
    
    // Check for double ring (0.93 to 1.0)
    if (distance >= 0.93 && distance <= 1.0) {
      return target.type === 'double'
    }
    
    // Everything else is single
    return target.type === 'single'
  }

  const calculateTrainingPoints = (target: TargetSpot, attemptNumber: number): number => {
    const basePoints = {
      'single': 100,
      'double': 200,
      'triple': 300,
      'bullseye': 200,
      'outer-bull': 100
    }
    
    const base = basePoints[target.type]
    if (attemptNumber === 1) return base
    if (attemptNumber === 2) return Math.floor(base / 2)
    return Math.floor(base / 4)
  }

  const getSectionKey = (target: TargetSpot): string => {
    if (target.type === 'bullseye') return 'bullseye'
    if (target.type === 'outer-bull') return 'outer-bull'
    return `${target.type}-${target.number}`
  }

  const updateTrainingAccuracy = (target: TargetSpot, hit: boolean) => {
    // Track every attempt: if you have 3 shots at single-20 and hit on 2nd try,
    // that's 2 attempts (1 miss + 1 hit) with 1 hit = 50% for this target
    const sectionKey = getSectionKey(target)
    setTrainingAccuracy(prev => {
      const sections = { ...prev.sections }
      const current = sections[sectionKey] || { attempts: 0, hits: 0 }
      sections[sectionKey] = {
        attempts: current.attempts + 1,
        hits: current.hits + (hit ? 1 : 0)
      }
      return { sections }
    })
  }

  const handleTrainingTargetClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!currentTarget || trainingAttemptsLeft === 0) return

    const wrapper = event.currentTarget
    const svg = wrapper.querySelector('svg')
    if (!svg) return
    
    // Get click position in SVG coordinates
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    
    // Convert SVG coordinates to normalized (-1 to 1) where dartboard center (50,50) maps to (0,0)
    const normalizedX = (svgP.x - 50) / 50
    const normalizedY = (svgP.y - 50) / 50
    const score = calculateScore(normalizedX, normalizedY)
    
    // Allow shots outside the dartboard in training mode (they count as misses)
    const shot: Shot = {
      x: normalizedX,
      y: normalizedY,
      score,
    }

    const updatedSpotShots = [...currentSpotShots, shot]
    setCurrentSpotShots(updatedSpotShots)
    setAllTrainingShots(prev => [...prev, shot])

    const hitTarget = checkIfHitTarget(shot, currentTarget)
    const attemptNumber = 4 - trainingAttemptsLeft

    // Update accuracy tracking - count this attempt
    updateTrainingAccuracy(currentTarget, hitTarget)

    if (hitTarget) {
      // Hit the target! Award points
      const points = calculateTrainingPoints(currentTarget, attemptNumber)
      setTrainingScore(prev => prev + points)
      const newSpotsCompleted = spotsCompleted + 1
      setSpotsCompleted(newSpotsCompleted)
      
      // Show feedback animation
      setTrainingFeedback({ message: `+${points}`, type: 'hit' })
      setTimeout(() => setTrainingFeedback(null), 1000)
      
      // Check if training session is complete
      if (newSpotsCompleted >= TRAINING_MAX_SPOTS) {
        // End training session and save automatically
        setTimeout(() => {
          handleSaveTrainingGame()
        }, 500)
        return
      }
      
      // Move to next target after a brief moment
      setTimeout(() => {
        setCurrentTarget(generateRandomTarget())
        setCurrentSpotShots([])
        setTrainingAttemptsLeft(3)
      }, 500)
    } else {
      // Missed, decrement attempts
      const newAttemptsLeft = trainingAttemptsLeft - 1
      setTrainingAttemptsLeft(newAttemptsLeft)
      
      // Show feedback animation
      setTrainingFeedback({ message: 'Missed', type: 'miss' })
      setTimeout(() => setTrainingFeedback(null), 1000)
      
      if (newAttemptsLeft === 0) {
        // Out of attempts, check if session is complete
        const newSpotsCompleted = spotsCompleted + 1
        setSpotsCompleted(newSpotsCompleted)
        
        if (newSpotsCompleted >= TRAINING_MAX_SPOTS) {
          // End training session and save automatically
          setTimeout(() => {
            handleSaveTrainingGame()
          }, 500)
          return
        }
        
        // Move to next target
        setTimeout(() => {
          setCurrentTarget(generateRandomTarget())
          setCurrentSpotShots([])
          setTrainingAttemptsLeft(3)
        }, 500)
      }
    }
  }

  const handleTrainingUndoShot = () => {
    if (currentSpotShots.length === 0) return
    
    // Get the last shot to check if it was a hit
    const lastShot = currentSpotShots[currentSpotShots.length - 1]
    if (lastShot && currentTarget) {
      const wasHit = checkIfHitTarget(lastShot, currentTarget)
      
      // Reverse the accuracy tracking
      const sectionKey = getSectionKey(currentTarget)
      setTrainingAccuracy(prev => {
        const sections = { ...prev.sections }
        const current = sections[sectionKey]
        if (current && current.attempts > 0) {
          sections[sectionKey] = {
            attempts: current.attempts - 1,
            hits: current.hits - (wasHit ? 1 : 0)
          }
        }
        return { sections }
      })
    }
    
    setCurrentSpotShots(prev => prev.slice(0, -1))
    setAllTrainingShots(prev => prev.slice(0, -1))
    setTrainingAttemptsLeft(prev => Math.min(prev + 1, 3))
  }

  // No need for handleConfirmEnd in single session darts game

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

  const handleSaveTrainingGame = async () => {
    if (!user) return

    const game: Game = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      shots: allTrainingShots,
      totalScore: trainingScore,
      gameMode: 'training',
      trainingAccuracy,
    }

    try {
      await saveGameToFirestore(user.uid, game)
      setGames(prev => [game, ...prev])
      resetTrainingState()
      setView('home')
    } catch (error) {
      console.error('Failed to save training game:', error)
      alert('Failed to save your training session. Please try again.')
    }
  }

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
      trainingGames={games}
    />
  )

  const trainingView = currentTarget ? (
    <TrainingPage
      canUndoShot={currentSpotShots.length > 0}
      onUndoShot={handleTrainingUndoShot}
      undoIcon={UndoIcon}
      onTargetClick={handleTrainingTargetClick}
      currentSpotShots={currentSpotShots}
      totalScore={trainingScore}
      currentTarget={currentTarget}
      attemptsLeft={trainingAttemptsLeft}
      onEndTraining={handleSaveTrainingGame}
      spotsCompleted={spotsCompleted}
      maxSpots={TRAINING_MAX_SPOTS}
      feedback={trainingFeedback}
    />
  ) : null

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
      <StatsView rounds={gamesAsRounds} userId={user?.uid ?? ''} onDeleteRound={handleDeleteGame} games={games} />
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
