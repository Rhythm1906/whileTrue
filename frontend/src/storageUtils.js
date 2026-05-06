/**
 * STORAGE UTILITIES
 *
 * Local browser storage for game state:
 * - Save current game to localStorage
 * - Load game from localStorage
 * - Clear saved game
 * - Check if game exists
 *
 * Uses browser's localStorage with JSON serialization
 */

const STORAGE_KEY = 'judges-court-game-state'

/**
 * Save game state to localStorage
 * Returns true if successful, false if storage full or unavailable
 *
 * @param {Object} gameState - Complete game state to save
 * @returns {boolean} Success status
 */
function saveGameState(gameState) {
  try {
    const serialized = JSON.stringify(gameState)
    localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (error) {
    console.error('Failed to save game state:', error)
    // Could be QuotaExceededError, SecurityError, etc.
    return false
  }
}

/**
 * Load game state from localStorage
 * Returns null if no saved game or if deserialization fails
 *
 * @returns {Object|null} Loaded game state or null
 */
function loadGameState() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      return null
    }
    return JSON.parse(serialized)
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

/**
 * Check if a saved game exists
 *
 * @returns {boolean} True if saved game exists
 */
function hasSavedGame() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

/**
 * Delete saved game from localStorage
 * Returns true if successful
 *
 * @returns {boolean} Success status
 */
function deleteSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Failed to delete saved game:', error)
    return false
  }
}

/**
 * Get basic info about saved game without loading full state
 * Useful for showing "Continue Game?" with stats preview
 *
 * @returns {Object|null} {caseCount, stats} or null if no game
 */
function getSavedGameInfo() {
  const gameState = loadGameState()
  if (!gameState) {
    return null
  }
  return {
    caseCount: gameState.caseCount,
    stats: gameState.stats,
    timestamp: gameState.timestamp,
  }
}

/**
 * Auto-save game state periodically
 * Returns a function to stop auto-saving
 *
 * @param {Object} gameState - Current game state
 * @param {number} intervalMs - Interval in milliseconds (default 30s)
 * @returns {Function} Stop function
 */
function setupAutoSave(gameState, intervalMs = 30000) {
  const interval = setInterval(() => {
    saveGameState(gameState)
  }, intervalMs)

  return () => clearInterval(interval)
}

export {
  saveGameState,
  loadGameState,
  hasSavedGame,
  deleteSavedGame,
  getSavedGameInfo,
  setupAutoSave,
}
