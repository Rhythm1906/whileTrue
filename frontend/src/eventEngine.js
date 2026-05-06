/**
 * RANDOM EVENT ENGINE
 *
 * Generates random events that modify stats:
 * - Protests
 * - Economic boom/crash
 * - Corruption scandals
 * - Riots
 * - Donations/support
 * - Natural disasters
 * - Celebration/morale
 *
 * Events add unpredictability and replayability
 */

/**
 * Event types with their descriptions and effects
 */
const EVENT_TYPES = {
  PROTEST: {
    name: 'Protest',
    effects: {
      trust: -5,
      economy: -3,
      chaos: 10,
    },
    messages: [
      'A large protest erupted in the streets!',
      'Citizens gathered to voice their discontent.',
      'Public demonstration turned the city upside down!',
    ],
  },

  ECONOMIC_BOOM: {
    name: 'Economic Boom',
    effects: {
      trust: 5,
      economy: 15,
      chaos: 0,
    },
    messages: [
      'Markets flourished! The economy boomed.',
      'Trade increased and merchants are thriving.',
      'Fortune favors your nation—coffers are full!',
    ],
  },

  ECONOMIC_CRISIS: {
    name: 'Economic Crisis',
    effects: {
      trust: -8,
      economy: -12,
      chaos: 5,
    },
    messages: [
      'The markets crashed unexpectedly!',
      'Merchants report severe losses.',
      'Economic hardship grips the nation.',
    ],
  },

  CORRUPTION_SCANDAL: {
    name: 'Corruption Scandal',
    effects: {
      trust: -15,
      economy: 3,
      chaos: 5,
    },
    messages: [
      'A corruption scandal rocks the government!',
      'Officials are accused of embezzlement.',
      'Trust in institutions crumbles.',
    ],
  },

  RIOT: {
    name: 'Riot',
    effects: {
      trust: -10,
      economy: -5,
      chaos: 15,
    },
    messages: [
      'Riots broke out in the capital!',
      'Angry mobs clashed with guards.',
      'Chaos spread through the streets.',
    ],
  },

  DONATION: {
    name: 'Generous Donation',
    effects: {
      trust: 10,
      economy: 8,
      chaos: 0,
    },
    messages: [
      'A wealthy merchant made a generous donation!',
      'Public support surges with private funding.',
      'A benefactor steps forward to help.',
    ],
  },

  NATURAL_DISASTER: {
    name: 'Natural Disaster',
    effects: {
      trust: -5,
      economy: -10,
      chaos: 8,
    },
    messages: [
      'A natural disaster struck the region!',
      'Floods devastated nearby villages.',
      'An earthquake shook the foundations.',
    ],
  },

  CELEBRATION: {
    name: 'Celebration',
    effects: {
      trust: 8,
      economy: 0,
      chaos: -5,
    },
    messages: [
      'The people celebrate a festival of joy!',
      'Morale soars across the realm.',
      'A grand celebration unites the nation.',
    ],
  },

  PLAGUE: {
    name: 'Plague',
    effects: {
      trust: -12,
      economy: -8,
      chaos: 10,
    },
    messages: [
      'A plague sweeps through the land!',
      'Sickness spreads among the population.',
      'Disease cripples productivity.',
    ],
  },

  HERO_EMERGES: {
    name: 'Hero Emerges',
    effects: {
      trust: 12,
      economy: 3,
      chaos: -8,
    },
    messages: [
      'A local hero saved lives!',
      'A brave citizen prevented a tragedy.',
      'Heroic deeds inspire the nation.',
    ],
  },
}

/**
 * Get list of all event types
 */
function getAllEventTypes() {
  return Object.keys(EVENT_TYPES)
}

/**
 * Generate a random event with a given probability
 * By default, 30% chance of event happening
 *
 * @param {number} probability - Chance of event occurring (0-1), default 0.3
 * @returns {Object|null} Random event or null if no event occurs
 */
function generateRandomEvent(probability = 0.3) {
  if (Math.random() > probability) {
    return null
  }

  const eventKeys = getAllEventTypes()
  const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)]
  const eventTemplate = EVENT_TYPES[randomKey]

  return {
    type: randomKey,
    name: eventTemplate.name,
    effects: {
      trust: eventTemplate.effects.trust,
      economy: eventTemplate.effects.economy,
      chaos: eventTemplate.effects.chaos,
    },
    message: eventTemplate.messages[
      Math.floor(Math.random() * eventTemplate.messages.length)
    ],
  }
}

/**
 * Get event probability based on current stats
 * Higher chaos = higher event probability
 * Lower trust = higher event probability
 *
 * @param {Object} stats - Current stats
 * @returns {number} Event probability (0-1)
 */
function getEventProbability(stats) {
  // Base probability of 30%
  let probability = 0.3

  // Increase if chaos is high
  if (stats.chaos > 75) {
    probability += 0.15
  } else if (stats.chaos > 50) {
    probability += 0.08
  }

  // Increase if trust is low
  if (stats.trust < 25) {
    probability += 0.15
  } else if (stats.trust < 40) {
    probability += 0.08
  }

  return Math.min(probability, 0.7) // Cap at 70%
}

/**
 * Generate random event with adaptive probability
 * More likely when stats are in crisis
 */
function generateAdaptiveRandomEvent(stats) {
  const probability = getEventProbability(stats)
  return generateRandomEvent(probability)
}

export {
  EVENT_TYPES,
  generateRandomEvent,
  generateAdaptiveRandomEvent,
  getEventProbability,
  getAllEventTypes,
}
