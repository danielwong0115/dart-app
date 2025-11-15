import { collection, doc, setDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Round, StoredRound, StoredShot, Game, StoredGame } from './types'
import { calculateEndPrecision } from './helpers'

/**
 * Save a single game to Firestore for a specific user
 */
export const saveGameToFirestore = async (userId: string, game: Game): Promise<void> => {
  try {
    const userGamesRef = collection(db, 'users', userId, 'games')
    
    const storedGame: StoredGame = {
      id: game.id,
      createdAt: game.createdAt,
      totalScore: game.totalScore,
      shots: game.shots.map(shot => ({
        x: shot.x,
        y: shot.y,
        score: shot.score,
      })),
      ...(game.notes && { notes: game.notes }),
      ...(game.gameMode && { gameMode: game.gameMode }),
      ...(game.turns && { 
        turns: game.turns.map(turn => ({
          shots: turn.shots.map(shot => ({
            x: shot.x,
            y: shot.y,
            score: shot.score,
          })),
          turnScore: turn.turnScore,
          ...(turn.isBust && { isBust: turn.isBust }),
        }))
      }),
      ...(game.startingScore !== undefined && { startingScore: game.startingScore }),
    }

    await setDoc(doc(userGamesRef, game.id), storedGame)
  } catch (error) {
    console.error('Error saving game to Firestore:', error)
    throw error
  }
}

/**
 * Load games from Firestore for a specific user
 */
export const loadGamesFromFirestore = async (userId: string): Promise<Game[]> => {
  try {
    const userGamesRef = collection(db, 'users', userId, 'games')
    const q = query(userGamesRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const games: Game[] = []
    
    querySnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data() as StoredGame
      
      games.push({
        id: data.id ?? docSnapshot.id,
        createdAt: data.createdAt ?? new Date().toISOString(),
        shots: (data.shots ?? []).map(shot => ({
          x: shot.x ?? 0,
          y: shot.y ?? 0,
          score: shot.score ?? 0,
        })),
        totalScore: data.totalScore ?? 0,
        notes: data.notes,
        gameMode: data.gameMode,
        turns: data.turns?.map(turn => ({
          shots: turn.shots.map(shot => ({
            x: shot.x ?? 0,
            y: shot.y ?? 0,
            score: shot.score ?? 0,
          })),
          turnScore: turn.turnScore ?? 0,
          isBust: turn.isBust,
        })),
        startingScore: data.startingScore,
      })
    })
    
    return games
  } catch (error) {
    console.error('Error loading games from Firestore:', error)
    throw error
  }
}

/**
 * Delete a game from Firestore for a specific user
 */
export const deleteGameFromFirestore = async (userId: string, gameId: string): Promise<void> => {
  try {
    const gameRef = doc(db, 'users', userId, 'games', gameId)
    await deleteDoc(gameRef)
  } catch (error) {
    console.error('Error deleting game from Firestore:', error)
    throw error
  }
}

// ===== LEGACY ROUND FUNCTIONS (for backward compatibility) =====

export const saveRoundToFirestore = async (userId: string, round: Round): Promise<void> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    
    // Convert round to storable format
    const roundData = round.ends.reduce<Record<string, Record<string, StoredShot>>>((acc, end, endIndex) => {
      const endKey = `end${String(endIndex + 1).padStart(2, '0')}`
      const shotEntries: Record<string, StoredShot> = {}
      end.shots.forEach((shot, shotIndex) => {
        const shotKey = `shot${shotIndex + 1}`
        shotEntries[shotKey] = {
          x: shot.x,
          y: shot.y,
          score: shot.score,
        }
      })
      acc[endKey] = shotEntries
      return acc
    }, {})

    const storedRound: StoredRound = {
      id: round.id,
      createdAt: round.createdAt,
      totalScore: round.totalScore,
      round: roundData,
      ...(round.notes && { notes: round.notes }),
    }

    // Save the round with the round ID as the document ID
    await setDoc(doc(userRoundsRef, round.id), storedRound)
  } catch (error) {
    console.error('Error saving round to Firestore:', error)
    throw error
  }
}

/**
 * Save multiple rounds to Firestore for a specific user
 */
export const saveRoundsToFirestore = async (userId: string, rounds: Round[]): Promise<void> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    
    // Convert rounds to storable format
    const storedRounds: StoredRound[] = rounds.map(round => {
      const roundData = round.ends.reduce<Record<string, Record<string, StoredShot>>>((acc, end, endIndex) => {
        const endKey = `end${String(endIndex + 1).padStart(2, '0')}`
        const shotEntries: Record<string, StoredShot> = {}
        end.shots.forEach((shot, shotIndex) => {
          const shotKey = `shot${shotIndex + 1}`
          shotEntries[shotKey] = {
            x: shot.x,
            y: shot.y,
            score: shot.score,
          }
        })
        acc[endKey] = shotEntries
        return acc
      }, {})

      return {
        id: round.id,
        createdAt: round.createdAt,
        totalScore: round.totalScore,
        round: roundData,
        ...(round.notes && { notes: round.notes }),
      }
    })

    // Save each round as a document with the round ID as the document ID
    await Promise.all(
      storedRounds.map(round =>
        setDoc(doc(userRoundsRef, round.id), round)
      )
    )
  } catch (error) {
    console.error('Error saving rounds to Firestore:', error)
    throw error
  }
}

/**
 * Load rounds from Firestore for a specific user
 */
export const loadRoundsFromFirestore = async (userId: string): Promise<Round[]> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    const q = query(userRoundsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const rounds: Round[] = []
    
    querySnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data() as StoredRound
      
      // Hydrate the round from stored format
      const ends = Object.keys(data.round ?? {})
        .sort()
        .map(endKey => {
          const storedShots = data.round?.[endKey] ?? {}
          const orderedShots = Object.keys(storedShots)
            .sort()
            .map(shotKey => storedShots[shotKey])
            .filter(
              (entry): entry is StoredShot =>
                typeof entry === 'object' && entry !== null && 'score' in entry
            )

          const shots = orderedShots.map(entry => ({
            x: typeof entry.x === 'number' ? entry.x : 0,
            y: typeof entry.y === 'number' ? entry.y : 0,
            score: typeof entry.score === 'number' ? entry.score : 0,
          }))

          const endScore = shots.reduce((total, shot) => total + shot.score, 0)
          const precision = calculateEndPrecision(shots)
          return { shots, endScore, precision }
        })

      const totalScore = data.totalScore ?? ends.reduce((total, end) => total + end.endScore, 0)

      rounds.push({
        id: data.id ?? docSnapshot.id,
        createdAt: data.createdAt ?? new Date().toISOString(),
        ends,
        totalScore,
        notes: data.notes,
      })
    })
    
    return rounds
  } catch (error) {
    console.error('Error loading rounds from Firestore:', error)
    throw error
  }
}

/**
 * Update notes for a specific round in Firestore
 */
export const updateRoundNotesInFirestore = async (userId: string, roundId: string, notes: string): Promise<void> => {
  try {
    const roundRef = doc(db, 'users', userId, 'rounds', roundId)
    await setDoc(roundRef, { notes }, { merge: true })
  } catch (error) {
    console.error('Error updating round notes in Firestore:', error)
    throw error
  }
}

/**
 * Delete a round from Firestore for a specific user
 */
export const deleteRoundFromFirestore = async (userId: string, roundId: string): Promise<void> => {
  try {
    const roundRef = doc(db, 'users', userId, 'rounds', roundId)
    await deleteDoc(roundRef)
  } catch (error) {
    console.error('Error deleting round from Firestore:', error)
    throw error
  }
}
