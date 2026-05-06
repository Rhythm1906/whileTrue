/**
 * GAME ENGINE
 *
 * Core gameplay logic:
 * - Apply decision effects to stats
 * - Validate stat ranges
 * - Calculate difficulty scaling
 * - Resolve game over conditions
 */

import {
  STAT_MIN,
  STAT_MAX,
  checkGameOverCondition,
  getDifficultyMultiplier,
  GameStatus,
} from './gameState'

/**
 * Clamp a stat value to valid range [0-100]
 */
function clampStat(value) {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(value)))
}

/**
 * Apply decision effects to current stats
 * Takes into account difficulty scaling
 *
 * @param {Object} currentStats - Current stats {trust, economy, chaos}
 * @param {Object} effects - Decision effects {trust, economy, chaos}
 * @param {number} caseCount - Current case number (for difficulty scaling)
 * @returns {Object} New stats after applying effects
 */
function applyDecisionEffects(currentStats, effects, caseCount) {
  const difficulty = getDifficultyMultiplier(caseCount)

  // Scale effects based on difficulty
  const scaledEffects = {
    trust: Math.round((effects.trust || 0) * difficulty),
    economy: Math.round((effects.economy || 0) * difficulty),
    chaos: Math.round((effects.chaos || 0) * difficulty),
  }

  return {
    trust: clampStat(currentStats.trust + scaledEffects.trust),
    economy: clampStat(currentStats.economy + scaledEffects.economy),
    chaos: clampStat(currentStats.chaos + scaledEffects.chaos),
  }
}

/**
 * Validate that effects are "mixed" (have both positive and negative impact)
 * This ensures no decision is purely good or bad
 */
function validateMixedEffects(effects) {
  const values = Object.values(effects).filter((v) => v !== 0)
  if (values.length === 0) return false

  const hasPositive = values.some((v) => v > 0)
  const hasNegative = values.some((v) => v < 0)

  return hasPositive && hasNegative
}

/**
 * Execute a player decision
 * Returns the result including new stats and any random event
 *
 * @param {Object} gameState - Current game state
 * @param {Object} choice - The chosen option {text, effects}
 * @param {Object} randomEvent - Optional random event to apply
 * @returns {Object} {newStats, gameStatus, message}
 */
function resolveDecision(gameState, choice, randomEvent = null) {
  // Apply choice effects
  let newStats = applyDecisionEffects(gameState.stats, choice.effects, gameState.caseCount)

  // Apply random event if present
  if (randomEvent && randomEvent.effects) {
    newStats = applyDecisionEffects(newStats, randomEvent.effects, gameState.caseCount)
  }

  // Check game over conditions
  const overCondition = checkGameOverCondition(newStats, gameState.caseCount + 1)

  // Build result message
  let message = `Your decision: "${choice.text}"`
  if (randomEvent) {
    message += `\n\n${randomEvent.message}`
  }

  const result = {
    newStats,
    newCaseCount: gameState.caseCount + 1,
    message,
  }

  if (overCondition) {
    result.gameStatus = overCondition.status
    result.lossReason = overCondition.reason
    result.gameOverMessage = overCondition.message
  }

  return result
}

/**
 * Get stat delta (change from previous to current)
 * Useful for displaying stat changes in UI
 */
function getStatDeltas(previousStats, newStats) {
  return {
    trust: newStats.trust - previousStats.trust,
    economy: newStats.economy - previousStats.economy,
    chaos: newStats.chaos - previousStats.chaos,
  }
}

/**
 * Get all stat names
 */
function getStatNames() {
  return ['trust', 'economy', 'chaos']
}

/**
 * Check if a stat is critical (below 20% or above 80% for chaos)
 */
function isCritical(statName, value) {
  if (statName === 'chaos') {
    return value >= 80
  }
  return value <= 20
}

/**
 * Get a warning message if any stat is critical
 */
function getCriticalStatWarning(stats) {
  const warnings = []

  if (stats.trust <= 20) {
    warnings.push('Public trust is dangerously low!')
  }
  if (stats.economy <= 20) {
    warnings.push('The economy is on the verge of collapse!')
  }
  if (stats.chaos >= 80) {
    warnings.push('Society is descending into chaos!')
  }

  return warnings.length > 0 ? warnings.join(' ') : null
}

export {
  applyDecisionEffects,
  validateMixedEffects,
  resolveDecision,
  getStatDeltas,
  getStatNames,
  isCritical,
  getCriticalStatWarning,
}
