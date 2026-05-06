# Judge's Court - Gameplay Systems Documentation

> AI-powered courtroom decision game inspired by "Sort the Court"

## 📋 Overview

This directory contains all core gameplay systems for Judge's Court. The game is built with vanilla JS logic (React-compatible) and is designed to be simple, strategic, and highly replayable.

### Key Features
- ✅ Simple & fast to build
- ✅ Deep strategic decision-making
- ✅ High replayability (30 case progression)
- ✅ Dynamic difficulty scaling
- ✅ Random events for unpredictability
- ✅ Persistent save/load system
- ✅ AI + local fallback case system

---

## 🎮 Core Gameplay Loop

```
1. Load a case
   ↓
2. Show player choices
   ↓
3. Player selects decision
   ↓
4. Apply effects with difficulty scaling
   ↓
5. Generate random event (if triggered)
   ↓
6. Check game over conditions
   ↓
7. Update stats and history
   ↓
8. Repeat until 30 cases (win) or stat collapse (loss)
```

---

## 📊 Game Stats

All stats range from **0-100**:

| Stat | Start | Loss Condition | Increases | Decreases |
|------|-------|---|---|---|
| **Trust** | 50 | ≤ 0 | Fair decisions, helping | Unjust rulings, inaction |
| **Economy** | 50 | ≤ 0 | Taxes, fines, budget cuts | Subsidies, funding |
| **Chaos** | 50 | ≥ 100 | Leniency, mob rule | Strict justice, stability |

### Game Over Conditions
- **Trust ≤ 0**: "The people removed you from office."
- **Economy ≤ 0**: "The nation went bankrupt."
- **Chaos ≥ 100**: "Society collapsed into chaos."

### Win Condition
- **Survive 30 cases**: "Legendary Judge!"

---

## 📁 File Structure

### Core Modules

#### `gameState.js` - State Management
Manages complete game state structure and constants.

**Exports:**
- `createGameState()` - Create fresh game
- `cloneGameState()` - Deep copy state
- `checkGameOverCondition()` - Check end conditions
- `getDifficultyMultiplier()` - Scale based on progress
- Constants: `INITIAL_STATS`, `STAT_MIN/MAX`, `CASES_TO_WIN`

#### `gameEngine.js` - Core Logic
Stat calculations, decision resolution, and game rules.

**Key Functions:**
- `applyDecisionEffects()` - Apply choice + difficulty scaling
- `resolveDecision()` - Process player decision
- `getStatDeltas()` - Calculate stat changes
- `getCriticalStatWarning()` - Get warning if stats critical

**Game Design Rule**: Every decision helps one stat, hurts another.

#### `eventEngine.js` - Random Events
10+ random events that modify stats and add narrative.

**Event Types:**
- 🔥 Protest, Riots
- 📈 Economic Boom/Crisis
- 🏛️ Corruption Scandal
- 🎉 Celebration, Hero Emerges
- 🦠 Plague
- 🌊 Natural Disaster
- 💰 Donations

**Events trigger at:**
- Base 30% probability
- Scales up with high Chaos/low Trust
- Max 70% probability

#### `caseManager.js` - Case System
Loads and manages court cases.

**Features:**
- 10+ built-in fallback cases
- Random selection with no-repeat tracking
- Support for AI-generated cases
- Default case as absolute fallback

#### `gameController.js` - Main Interface
Central controller that orchestrates all systems.

**Primary API** for React components - all game operations go through here.

#### `storageUtils.js` - Save System
localStorage persistence.

**Functions:**
- `saveGameState()` / `loadGameState()`
- `hasSavedGame()` / `deleteSavedGame()`
- `setupAutoSave()` - Periodic saves

#### `debugUtils.js` - Debugging Tools
Analytics, logging, balance checking.

**Useful for:**
- Analyzing stat progression
- Checking game balance
- Debugging event rates
- Exporting game data

---

## 🚀 Quick Start - Using in React

### 1. Initialize Game

```javascript
import gameController from './gameController'
import { fetchCourtCase } from './api'

// Start new game
gameController.initializeNewGame()

// Or load saved game
if (gameController.loadFromStorage()) {
  // Game loaded
}
```

### 2. Load Case

```javascript
const currentCase = await gameController.loadNextCase(fetchCourtCase)
// currentCase = {character, text, choices}
```

### 3. Handle Player Decision

```javascript
const result = gameController.makeDecision(playerChoice)
// result = {
//   newStats, statDeltas, randomEvent, message,
//   warning, gameStatus, gameOverMessage, caseCount, casesRemaining
// }
```

### 4. Check Game Status

```javascript
import { GameStatus } from './gameState'

if (result.gameStatus === GameStatus.WON) {
  // Show win screen
}
if (result.gameStatus === GameStatus.LOST) {
  // Show loss screen with reason
}
```

### 5. Save Game

```javascript
gameController.saveToStorage()
```

---

## 📖 API Reference

### GameController Main Methods

```javascript
// Initialization
gameController.initializeNewGame()      // Start fresh
gameController.loadFromStorage()        // Load saved game
gameController.restart()                // New game after loss

// State Access
gameController.getGameState()           // Full state copy
gameController.getStats()               // {trust, economy, chaos}
gameController.getStatus()              // SETUP|PLAYING|WON|LOST
gameController.getCaseCount()           // Number of cases handled
gameController.getCasesUntilWin()       // Remaining to reach 30

// Case Management
await gameController.loadNextCase(fetchFn?)    // Load next case
gameController.getCurrentCase()         // Get active case

// Decisions
gameController.makeDecision(choice, generateEvent?)  // Execute decision

// Game Over
gameController.getGameOverCondition()   // Get end state info

// Storage
gameController.saveToStorage()          // Save to localStorage
gameController.getHistory()             // Get all decisions made

// Static Methods
GameController.hasSavedGame()           // Check if save exists
GameController.deleteSavedGame()        // Delete save
```

---

## 🎯 Design Philosophy

### No "Perfect" Decisions
Every choice trades off:
- ✋ Forgive criminal → +Trust, -Chaos (but chaos stays high)
- ⚖️ Punish harshly → -Trust, +Economy, -Chaos (but angering people)
- 💰 Expensive solution → +Trust, -Economy (costs money)
- 🚫 Ignore problem → +Economy, but +Chaos, -Trust

### Difficulty Scaling
- **Cases 1-10**: Learning phase (1.0x multiplier)
- **Cases 11-20**: Challenge phase (1.25x multiplier)
- **Cases 21-30**: Expert phase (1.5x multiplier)

Effects grow over time, making late decisions more consequential.

### Adaptive Events
Random events are more likely when:
- Chaos > 75 (+15% probability)
- Trust < 25 (+15% probability)

This creates emergent chaos during crises.

---

## 💾 Save System

### What Gets Saved
- Current stats
- Case count
- Full decision history
- Timestamp
- Game seed (for consistency)

### Storage
- Uses browser `localStorage`
- ~50KB per full game (safe limit)
- No backend required
- Auto-deletes when "New Game" pressed

### Restore Flow
```javascript
if (GameController.hasSavedGame()) {
  // Show "Continue Game?" button
  gameController.loadFromStorage()
} else {
  // Show "New Game" only
  gameController.initializeNewGame()
}
```

---

## 🧪 Testing & Balance

### Check Game Balance

```javascript
import { checkGameBalance, generateGameReport } from './debugUtils'

const report = generateGameReport(gameState)
console.log(report)
// Shows: summary, decision analysis, balance issues
```

### Simulate Gameplay

```javascript
import { simulateRandomGameplay } from './debugUtils'

const results = simulateRandomGameplay(gameController, 30)
// Play 30 cases with random decisions, analyze results
```

### Log Decisions

```javascript
import { logDecisionResult } from './debugUtils'

logDecisionResult(caseNum, choice, result)
// Pretty console output of decision effects
```

---

## 🔌 Integration Checklist

- [ ] Import `gameController` in main React component
- [ ] Call `initializeNewGame()` on first load
- [ ] Check for saved game with `GameController.hasSavedGame()`
- [ ] Load cases with `gameController.loadNextCase(fetchCourtCase)`
- [ ] Handle decisions with `gameController.makeDecision(choice)`
- [ ] Display stats from `gameController.getStats()`
- [ ] Check game over with `gameController.getStatus()`
- [ ] Save with `gameController.saveToStorage()`
- [ ] Show random events from `result.randomEvent`
- [ ] Display stat deltas from `result.statDeltas`
- [ ] Show warnings from `result.warning`

---

## 📦 Dependencies

**Zero external dependencies!**

All code is:
- ✅ Vanilla JavaScript
- ✅ ES6 modules
- ✅ React-compatible
- ✅ No npm packages required
- ✅ Works in modern browsers (ES2020+)

---

## 🎨 What's NOT Included

**These are handled by frontend teammates:**
- ❌ UI/styling
- ❌ React components
- ❌ Firebase auth/storage
- ❌ AI case generation (you have the API)
- ❌ Audio/visual effects

**You only provide:**
- ✅ Game systems (already built)
- ✅ Simple integration methods
- ✅ Well-documented APIs

---

## 📚 Example Usage

### Complete Game Loop in React

```javascript
import React, { useState, useEffect } from 'react'
import gameController from './gameController'
import { GameStatus } from './gameState'
import { fetchCourtCase } from './api'

export default function Game() {
  const [gameState, setGameState] = useState(null)
  const [currentCase, setCurrentCase] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Start game
    gameController.initializeNewGame()
    setGameState(gameController.getGameState())
    loadNextCase()
  }, [])

  const loadNextCase = async () => {
    setLoading(true)
    const caseData = await gameController.loadNextCase(fetchCourtCase)
    setCurrentCase(caseData)
    setResult(null)
    setLoading(false)
  }

  const handleDecision = (choice) => {
    const decisionResult = gameController.makeDecision(choice)
    setResult(decisionResult)
    setGameState(gameController.getGameState())

    if (decisionResult.gameStatus === GameStatus.WON) {
      // Show win screen
    } else if (decisionResult.gameStatus === GameStatus.LOST) {
      // Show loss screen
    } else {
      // Load next case after delay
      setTimeout(loadNextCase, 2000)
    }
  }

  const handleRestart = () => {
    gameController.restart()
    setGameState(gameController.getGameState())
    loadNextCase()
  }

  if (gameState?.status === GameStatus.WON) {
    return (
      <div>
        <h1>Legendary Judge!</h1>
        <p>You survived 30 cases!</p>
        <button onClick={handleRestart}>Play Again</button>
      </div>
    )
  }

  if (gameState?.status === GameStatus.LOST) {
    return (
      <div>
        <h1>Game Over</h1>
        <p>{result?.gameOverMessage}</p>
        <button onClick={handleRestart}>Try Again</button>
      </div>
    )
  }

  return (
    <div className="game">
      <div className="stats">
        <div>Trust: {gameState?.stats.trust}%</div>
        <div>Economy: {gameState?.stats.economy}%</div>
        <div>Chaos: {gameState?.stats.chaos}%</div>
        <div>Cases: {gameState?.caseCount} / 30</div>
      </div>

      {loading ? (
        <div>Loading case...</div>
      ) : currentCase ? (
        <div className="case">
          <h2>{currentCase.character}</h2>
          <p>{currentCase.text}</p>
          <div className="choices">
            {currentCase.choices.map((choice, i) => (
              <button key={i} onClick={() => handleDecision(choice)}>
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {result && (
        <div className="result">
          <p>{result.message}</p>
          {result.warning && <p className="warning">{result.warning}</p>}
        </div>
      )}
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### Stats Not Changing
- Check that choice has valid `effects`
- Verify effects have both positive and negative values
- Check `getDifficultyMultiplier()` isn't 0

### Game Ends Immediately
- Verify initial stats are (50, 50, 50)
- Check `checkGameOverCondition()` logic
- Confirm stat clamping is working

### Cases Not Loading
- Verify `fetchCourtCase` returns valid case structure
- Check fallback cases exist
- See browser console for errors

### Save Not Working
- Check `localStorage` is available (not disabled)
- Verify storage isn't full
- Try `deleteSavedGame()` to clear old saves

---

## 📝 License

Part of Judge's Court hackathon project.

---

## 🎯 Next Steps

1. **Frontend Dev**: Import `gameController` and build React UI
2. **Backend Dev**: Implement case generation API
3. **Designer**: Tune case difficulty and stat effects
4. **Tester**: Run balance checks with `debugUtils`

The game systems are **production-ready** and **fully documented**. Happy building! 🚀
