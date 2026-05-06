/**
 * GAME STATE MANAGEMENT
 *
 * Manages the complete game state including:
 * - Player stats (trust, economy, chaos)
 * - Game progress (case count, streak)
 * - Game status (playing, won, lost)
 */

// Initial stat values
const INITIAL_STATS = {
  trust: 50,
  economy: 50,
  chaos: 50,
}

// Game constants
const STAT_MIN = 0
const STAT_MAX = 100
const CASES_TO_WIN = 30

// Game status enum
const GameStatus = {
  SETUP: 'setup',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
}

// Loss reason enum
const LossReason = {
  TRUST_COLLAPSED: 'trust_collapsed',
  ECONOMY_COLLAPSED: 'economy_collapsed',
  CHAOS_OVERFLOW: 'chaos_overflow',
}

/**
 * Create a fresh game state
 */
function createGameState() {
  return {
    stats: { ...INITIAL_STATS },
    caseCount: 0,
    status: GameStatus.SETUP,
    lossReason: null,
    history: [], // Array of {caseId, choice, statsAfter, randomEvent}
    seed: Math.random(), // For consistency if needed
  }
}

/**
 * Get a deep copy of game state
 */
function cloneGameState(gameState) {
  return {
    stats: { ...gameState.stats },
    caseCount: gameState.caseCount,
    status: gameState.status,
    lossReason: gameState.lossReason,
    history: [...gameState.history],
    seed: gameState.seed,
  }
}

/**
 * Check if game is over (win or loss)
 * Returns null if game is still active, or {status, reason, message}
 */
function checkGameOverCondition(stats, caseCount) {
  // Loss conditions
  if (stats.trust <= 0) {
    return {
      status: GameStatus.LOST,
      reason: LossReason.TRUST_COLLAPSED,
      message: 'The people removed you from office.',
    }
  }

  if (stats.economy <= 0) {
    return {
      status: GameStatus.LOST,
      reason: LossReason.ECONOMY_COLLAPSED,
      message: 'The nation went bankrupt.',
    }
  }

  if (stats.chaos >= 100) {
    return {
      status: GameStatus.LOST,
      reason: LossReason.CHAOS_OVERFLOW,
      message: 'Society collapsed into chaos.',
    }
  }

  // Win condition
  if (caseCount >= CASES_TO_WIN) {
    return {
      status: GameStatus.WON,
      message: 'Legendary Judge! You survived 30 cases!',
    }
  }

  return null
}

/**
 * Get current game difficulty multiplier based on case count
 * Scales from 1.0 to 1.5 as game progresses
 */
function getDifficultyMultiplier(caseCount) {
  const progress = Math.min(caseCount / CASES_TO_WIN, 1)
  return 1 + progress * 0.5 // Range: 1.0 to 1.5
}

export {
  // Constants
  INITIAL_STATS,
  STAT_MIN,
  STAT_MAX,
  CASES_TO_WIN,
  GameStatus,
  LossReason,
  // Functions
  createGameState,
  cloneGameState,
  checkGameOverCondition,
  getDifficultyMultiplier,
}
