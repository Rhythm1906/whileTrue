/**
 * DEBUG & ANALYTICS UTILITIES
 *
 * Helpful functions for:
 * - Logging game events
 * - Analyzing stat progression
 * - Testing game balance
 * - Debugging player decisions
 */

/**
 * Format stats for console output
 */
function formatStats(stats) {
  return `Trust: ${stats.trust}% | Economy: ${stats.economy}% | Chaos: ${stats.chaos}%`
}

/**
 * Log decision result with formatted output
 */
function logDecisionResult(caseNumber, choice, result) {
  console.group(`Case ${caseNumber} - "${choice.text}"`)
  console.log('Stats Before:', formatStats(result.previousStats || {}))
  console.log('Stats After:', formatStats(result.newStats))
  console.log('Deltas:', result.statDeltas)
  if (result.randomEvent) {
    console.log('Random Event:', result.randomEvent.name, result.randomEvent.message)
  }
  if (result.warning) {
    console.warn('WARNING:', result.warning)
  }
  console.groupEnd()
}

/**
 * Generate a game summary for analytics
 */
function generateGameSummary(gameState) {
  const history = gameState.history || []

  const summary = {
    casesHandled: gameState.caseCount,
    decisionsMade: history.length,
    finalStats: { ...gameState.stats },
    randomEventsTriggered: history.filter((h) => h.randomEvent).length,
    gameStatus: gameState.status,
    gameLength: history.length,
  }

  // Analyze stat progression
  if (history.length > 0) {
    const firstStats = { trust: 50, economy: 50, chaos: 50 }
    const lastStats = gameState.stats

    summary.statChanges = {
      trust: lastStats.trust - firstStats.trust,
      economy: lastStats.economy - firstStats.economy,
      chaos: lastStats.chaos - firstStats.chaos,
    }
  }

  return summary
}

/**
 * Analyze decision patterns
 */
function analyzeDecisions(gameState) {
  const history = gameState.history || []

  const analysis = {
    totalDecisions: history.length,
    decisionsWithEvents: history.filter((h) => h.randomEvent).length,
    eventPercentage: (history.filter((h) => h.randomEvent).length / history.length * 100).toFixed(1),
  }

  // Most impactful decisions
  if (history.length > 1) {
    const deltas = history.map((h, i) => {
      const prevStats =
        i === 0
          ? { trust: 50, economy: 50, chaos: 50 }
          : history[i - 1].statsAfter

      return {
        choice: h.choiceText,
        impact: Math.abs(h.statsAfter.trust - prevStats.trust) +
                Math.abs(h.statsAfter.economy - prevStats.economy) +
                Math.abs(h.statsAfter.chaos - prevStats.chaos),
      }
    })

    analysis.mostImpactfulDecisions = deltas
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5)
  }

  return analysis
}

/**
 * Check game balance
 * Returns suggestions for balance tweaks
 */
function checkGameBalance(gameState) {
  const issues = []

  const stats = gameState.stats
  const history = gameState.history || []

  // Check stat variance
  const avgChange = (
    Math.abs(stats.trust - 50) +
    Math.abs(stats.economy - 50) +
    Math.abs(stats.chaos - 50)
  ) / 3

  if (avgChange < 5) {
    issues.push('Stats not changing enough - effects might be too small')
  }
  if (avgChange > 25) {
    issues.push('Stats changing too much - effects might be too large')
  }

  // Check if random events are triggering appropriately
  const eventRate = history.filter((h) => h.randomEvent).length / history.length
  if (eventRate < 0.15) {
    issues.push(`Event rate low (${(eventRate * 100).toFixed(1)}%) - consider increasing probability`)
  }
  if (eventRate > 0.5) {
    issues.push(`Event rate high (${(eventRate * 100).toFixed(1)}%) - consider decreasing probability`)
  }

  // Check game difficulty
  if (gameState.caseCount >= 30) {
    if (stats.trust > 80 && stats.economy > 80 && stats.chaos < 20) {
      issues.push('Game seems too easy - winning is too easy with these stats')
    }
  }

  return {
    balanceIssues: issues,
    eventRate: `${(eventRate * 100).toFixed(1)}%`,
    avgStatChange: avgChange.toFixed(1),
  }
}

/**
 * Generate a detailed game report
 */
function generateGameReport(gameState) {
  return {
    summary: generateGameSummary(gameState),
    decisionAnalysis: analyzeDecisions(gameState),
    balanceCheck: checkGameBalance(gameState),
    fullHistory: gameState.history,
  }
}

/**
 * Export game data as JSON (for sharing/debugging)
 */
function exportGameData(gameState) {
  return JSON.stringify(gameState, null, 2)
}

/**
 * Import game data from JSON
 */
function importGameData(jsonString) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to parse game data:', error)
    return null
  }
}

/**
 * Simulate a series of random decisions (for testing/balance checking)
 * Note: This requires the gameController
 */
function simulateRandomGameplay(gameController, numCases = 30) {
  const results = []

  for (let i = 0; i < numCases && gameController.getStatus() === 'playing'; i++) {
    const currentCase = gameController.getCurrentCase()
    if (!currentCase) break

    // Pick random choice
    const randomChoice =
      currentCase.choices[Math.floor(Math.random() * currentCase.choices.length)]

    // Make decision
    const result = gameController.makeDecision(randomChoice)
    results.push(result)
  }

  return results
}

export {
  formatStats,
  logDecisionResult,
  generateGameSummary,
  analyzeDecisions,
  checkGameBalance,
  generateGameReport,
  exportGameData,
  importGameData,
  simulateRandomGameplay,
}
