/**
 * CASE MANAGEMENT SYSTEM
 *
 * Handles:
 * - Case loading (AI or fallback)
 * - Case progression tracking
 * - Case shuffling and randomization
 * - Difficulty scaling (case effects increase)
 */

/**
 * Local fallback cases for when AI is unavailable
 * Mix of serious, humorous, and moral scenarios
 */
const FALLBACK_CASES = [
  {
    id: 1,
    character: 'Village Farmer',
    text: 'A farmer illegally used river water during drought season.',
    choices: [
      {
        text: 'Punish',
        effects: { trust: -10, economy: 5, chaos: -5 },
      },
      {
        text: 'Forgive',
        effects: { trust: 10, economy: -5, chaos: 10 },
      },
    ],
  },
  {
    id: 2,
    character: 'Market Vendor',
    text: 'A vendor is accused of selling overpriced food after a supply shortage.',
    choices: [
      {
        text: 'Fine',
        effects: { trust: 5, economy: 10, chaos: -5 },
      },
      {
        text: 'Warn',
        effects: { trust: 10, economy: -5, chaos: 5 },
      },
    ],
  },
  {
    id: 3,
    character: 'Town Guard',
    text: 'A guard accepted a small bribe to look the other way at a broken gate.',
    choices: [
      {
        text: 'Dismiss',
        effects: { trust: 10, economy: -5, chaos: 5 },
      },
      {
        text: 'Prosecute',
        effects: { trust: -5, economy: 10, chaos: -10 },
      },
    ],
  },
  {
    id: 4,
    character: 'Guild Apprentice',
    text: 'An apprentice secretly copied a masterwork to learn the craft faster.',
    choices: [
      {
        text: 'Ban',
        effects: { trust: -5, economy: 5, chaos: -10 },
      },
      {
        text: 'Mentor',
        effects: { trust: 10, economy: -10, chaos: 5 },
      },
    ],
  },
  {
    id: 5,
    character: 'River Boat Captain',
    text: 'A captain ignored local curfew laws to rescue stranded travelers.',
    choices: [
      {
        text: 'Reward',
        effects: { trust: 10, economy: -5, chaos: 5 },
      },
      {
        text: 'Fine',
        effects: { trust: -10, economy: 8, chaos: -8 },
      },
    ],
  },
  {
    id: 6,
    character: 'Orphanage Director',
    text: 'The orphanage is struggling financially but has never violated regulations.',
    choices: [
      {
        text: 'Grant subsidy',
        effects: { trust: 12, economy: -8, chaos: -3 },
      },
      {
        text: 'Ignore',
        effects: { trust: -8, economy: 3, chaos: 8 },
      },
    ],
  },
  {
    id: 7,
    character: 'Noble Lord',
    text: 'A lord is accused of exploiting peasant labor. He claims it is customary practice.',
    choices: [
      {
        text: 'Ban practice',
        effects: { trust: 8, economy: -12, chaos: 3 },
      },
      {
        text: 'Allow tradition',
        effects: { trust: -10, economy: 8, chaos: 5 },
      },
    ],
  },
  {
    id: 8,
    character: 'Alchemist',
    text: 'An alchemist claims to have discovered gold. The process is untested.',
    choices: [
      {
        text: 'Fund research',
        effects: { trust: 3, economy: -8, chaos: 5 },
      },
      {
        text: 'Imprison charlatan',
        effects: { trust: 5, economy: 2, chaos: -8 },
      },
    ],
  },
  {
    id: 9,
    character: 'Disgraced Scholar',
    text: 'A scholar was expelled for teaching forbidden knowledge. Citizens demand action.',
    choices: [
      {
        text: 'Exile',
        effects: { trust: 8, economy: -3, chaos: -5 },
      },
      {
        text: 'Reinstate quietly',
        effects: { trust: -8, economy: 5, chaos: 10 },
      },
    ],
  },
  {
    id: 10,
    character: 'Merchant Caravan',
    text: 'A traveling caravan was attacked on the roads. They demand protection.',
    choices: [
      {
        text: 'Hire guards (expensive)',
        effects: { trust: 10, economy: -15, chaos: -8 },
      },
      {
        text: 'Deny request',
        effects: { trust: -12, economy: 8, chaos: 5 },
      },
    ],
  },
]

/**
 * Get a random case from the pool
 * Ensures variety by trying not to repeat recent cases
 *
 * @param {Array<Object>} cases - Array of case objects
 * @param {Array<number>} recentCaseIds - Recently shown case IDs to avoid repeats
 * @returns {Object} A random case
 */
function pickRandomCase(cases, recentCaseIds = []) {
  if (!cases || cases.length === 0) {
    return getDefaultCase()
  }

  // Filter out recently shown cases if possible
  let available = cases
  if (recentCaseIds.length > 0) {
    available = cases.filter((c) => !recentCaseIds.includes(c.id))
  }

  // If all cases are recent, reset and use all cases
  if (available.length === 0) {
    available = cases
  }

  const index = Math.floor(Math.random() * available.length)
  return available[index]
}

/**
 * Get fallback cases pool
 */
function getFallbackCases() {
  return FALLBACK_CASES
}

/**
 * Get a default case (when all else fails)
 */
function getDefaultCase() {
  return {
    id: 0,
    character: 'Mysterious Stranger',
    text: 'A stranger arrives with a case that is difficult to judge.',
    choices: [
      {
        text: 'Side with stranger',
        effects: { trust: -8, economy: 3, chaos: 5 },
      },
      {
        text: 'Side with establishment',
        effects: { trust: 8, economy: -3, chaos: -5 },
      },
    ],
  }
}

/**
 * Shuffle cases to create variety in playthrough
 */
function shuffleCases(cases) {
  const shuffled = [...cases]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get recently used case IDs (last N cases)
 */
function getRecentCaseIds(gameHistory, count = 5) {
  return gameHistory.slice(-count).map((h) => h.caseId)
}

export {
  FALLBACK_CASES,
  pickRandomCase,
  getFallbackCases,
  getDefaultCase,
  shuffleCases,
  getRecentCaseIds,
}
