export type View = 'home' | 'game' | 'stats' | 'profile' | 'game-mode-select' | 'competition' | 'training'

export type Shot = {
  x: number
  y: number
  score: number
}

export type Turn = {
  shots: Shot[]
  turnScore: number
  isBust?: boolean
}

export type Game = {
  id: string
  createdAt: string
  shots: Shot[]
  totalScore: number
  notes?: string
  gameMode?: 'competition' | 'training'
  turns?: Turn[] // For competition mode
  startingScore?: number // For competition mode
}

export type StoredTurn = {
  shots: StoredShot[]
  turnScore: number
  isBust?: boolean
}

export type StoredGame = {
  id: string
  createdAt: string
  totalScore: number
  shots: StoredShot[]
  notes?: string
  gameMode?: 'competition' | 'training'
  turns?: StoredTurn[]
  startingScore?: number
}

export type StoredShot = {
  x?: number
  y?: number
  score: number
}

export type AggregateStats = {
  averagePoints: number
  averageDistanceFromCenter: number
  missedShots: number
  averagePrecision: number
  shotCount: number
}

// Legacy types for migration compatibility
export type End = {
  shots: Shot[]
  endScore: number
  precision: number
}

export type Round = {
  id: string
  createdAt: string
  ends: End[]
  totalScore: number
  notes?: string
}

export type StoredRound = {
  id: string
  createdAt: string
  totalScore: number
  round: Record<string, Record<string, StoredShot | number>>
  notes?: string
}
