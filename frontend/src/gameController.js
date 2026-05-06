/**
 * GAME CONTROLLER
 *
 * Main game loop orchestrator
 * Ties together all game systems:
 * - Game state management
 * - Case loading
 * - Decision resolution
 * - Event generation
 * - Storage
 *
 * This is the primary interface for React components
 */

import {
  createGameState,
  cloneGameState,
  GameStatus,
  CASES_TO_WIN,
} from './gameState'

import {
  resolveDecision,
  getStatDeltas,
  getCriticalStatWarning,
} from './gameEngine'

import {
  generateAdaptiveRandomEvent,
  generateRandomEvent,
} from './eventEngine'

import {
  saveGameState as storeSavedGame,
  loadGameState as loadStoredGame,
  hasSavedGame,
  deleteSavedGame as deleteStoredGame,
} from './storageUtils'

import {
  pickRandomCase,
  getRecentCaseIds,
  getFallbackCases,
  getDefaultCase,
} from './caseManager'

/**
 * Main Game Controller
 *
 * Manages the complete game lifecycle
 */
class GameController {
  constructor() {
    this.gameState = createGameState()
    this.currentCase = null
    this.previousStats = null
    this.lastRandomEvent = null
  }

  /**
   * Initialize a new game
   */
  initializeNewGame() {
    this.gameState = createGameState()
    this.gameState.status = GameStatus.PLAYING
    this.previousStats = { ...this.gameState.stats }
    return this.gameState
  }

  /**
   * Load game from storage
   * Returns true if successful, false if no saved game
   */
  loadFromStorage() {
    const stored = loadStoredGame()
    if (!stored) {
      return false
    }
    this.gameState = stored
    this.previousStats = { ...this.gameState.stats }
    return true
  }

  /**
   * Save current game to storage
   */
  saveToStorage() {
    const state = {
      ...this.gameState,
      timestamp: Date.now(),
    }
    return storeSavedGame(state)
  }

  /**
   * Check if game has been saved before
   */
  static hasSavedGame() {
    return hasSavedGame()
  }

  /**
   * Delete saved game from storage
   */
  static deleteSavedGame() {
    return deleteStoredGame()
  }

  /**
   * Get current game state (read-only copy)
   */
  getGameState() {
    return cloneGameState(this.gameState)
  }

  /**
   * Get current stats
   */
  getStats() {
    return { ...this.gameState.stats }
  }

  /**
   * Get current case count
   */
  getCaseCount() {
    return this.gameState.caseCount
  }

  /**
   * Get game status
   */
  getStatus() {
    return this.gameState.status
  }

  /**
   * Get cases until win
   */
  getCasesUntilWin() {
    return Math.max(0, CASES_TO_WIN - this.gameState.caseCount)
  }

  /**
   * Load next case
   * Fetches from AI or uses fallback
   */
  async loadNextCase(caseLoadFn) {
    try {
      // Try to fetch from provided function (could be AI or other source)
      if (caseLoadFn && typeof caseLoadFn === 'function') {
        this.currentCase = await caseLoadFn()
      } else {
        // Fallback to local cases
        const recentIds = getRecentCaseIds(this.gameState.history)
        this.currentCase = pickRandomCase(getFallbackCases(), recentIds)
      }
    } catch (error) {
      console.error('Failed to load case:', error)
      // Use absolute fallback
      this.currentCase = getDefaultCase()
    }

    return this.currentCase
  }

  /**
   * Get current case
   */
  getCurrentCase() {
    return this.currentCase
  }

  /**
   * Execute a player decision
   *
   * @param {Object} choice - The selected choice {text, effects}
   * @param {boolean} generateEvent - Whether to generate random event
   * @returns {Object} Result of decision {newStats, deltas, event, message, gameStatus}
   */
  makeDecision(choice, generateEvent = true) {
    // Validate game is in playable state
    if (this.gameState.status !== GameStatus.PLAYING) {
      return {
        error: 'Game is not active',
        gameStatus: this.gameState.status,
      }
    }

    // Generate random event if enabled
    const randomEvent = generateEvent
      ? generateAdaptiveRandomEvent(this.gameState.stats)
      : null

    // Store previous stats for delta calculation
    this.previousStats = { ...this.gameState.stats }

    // Resolve the decision
    const resolution = resolveDecision(this.gameState, choice, randomEvent)

    // Update game state
    this.gameState.stats = resolution.newStats
    this.gameState.caseCount = resolution.newCaseCount
    if (resolution.gameStatus) {
      this.gameState.status = resolution.gameStatus
      if (resolution.lossReason) {
        this.gameState.lossReason = resolution.lossReason
      }
    }

    // Record in history
    this.gameState.history.push({
      caseId: this.currentCase?.id || 0,
      choiceText: choice.text,
      statsAfter: { ...this.gameState.stats },
      randomEvent,
      message: resolution.message,
    })

    // Store last random event for UI display
    this.lastRandomEvent = randomEvent

    // Check for critical stat warnings
    const warning = getCriticalStatWarning(this.gameState.stats)

    return {
      newStats: this.gameState.stats,
      statDeltas: getStatDeltas(this.previousStats, this.gameState.stats),
      randomEvent,
      message: resolution.message,
      warning,
      gameStatus: this.gameState.status,
      gameOverMessage: resolution.gameOverMessage,
      caseCount: this.gameState.caseCount,
      casesRemaining: this.getCasesUntilWin(),
    }
  }

  /**
   * Get game over condition (if any)
   */
  getGameOverCondition() {
    if (this.gameState.status === GameStatus.LOST) {
      return {
        status: this.gameState.status,
        reason: this.gameState.lossReason,
        casesSurvived: this.gameState.caseCount,
      }
    }

    if (this.gameState.status === GameStatus.WON) {
      return {
        status: this.gameState.status,
        casesSurvived: this.gameState.caseCount,
      }
    }

    return null
  }

  /**
   * Restart the game
   */
  restart() {
    return this.initializeNewGame()
  }

  /**
   * Get game statistics
   */
  getStats() {
    return {
      currentStats: { ...this.gameState.stats },
      caseCount: this.gameState.caseCount,
      status: this.gameState.status,
      casesUntilWin: this.getCasesUntilWin(),
      decisionsMade: this.gameState.history.length,
    }
  }

  /**
   * Get game history
   */
  getHistory() {
    return [...this.gameState.history]
  }
}

// Export singleton instance
const gameController = new GameController()

export { GameController, gameController as default }
