import React from 'react'
import DialogueBox from './DialogueBox.jsx'
import VerdictButtons from './VerdictButtons.jsx'
import StatsBar from './StatsBar.jsx'

export default function Courtroom({ currentCase, stats, profile, onChoice, loading, error }) {
  return (
    <div className="courtroom-container">
      <div className="courtroom-scene">
        <div className="courtroom-floor"></div>
        
        {/* Character Portraits */}
        <div className="character-portrait judge">
          <div className="character-name">Judge</div>
        </div>
        
        <div className="character-portrait defendant">
          <div className="character-name">Defendant</div>
        </div>
        
        <div className="character-portrait attorney">
          <div className="character-name">Attorney</div>
        </div>

        {/* Dialogue Box */}
        {!loading && currentCase && (
          <DialogueBox 
            character={currentCase.character} 
            text={currentCase.text}
          />
        )}

        {loading && (
          <div className="dialogue-box">
            <div className="loading-text">Loading next case...</div>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>

      {/* UI Panel */}
      <div className="ui-panel">
        {/* Profile Info */}
        <div className="profile-info">
          <span>Presiding Judge:</span>
          <span className="profile-name">{profile.username}</span>
          <span>|</span>
          <span>Cases Decided: {profile.progress.caseIndex || 0}</span>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Verdict Buttons */}
        {!loading && currentCase && (
          <VerdictButtons 
            choices={currentCase.choices}
            onChoice={onChoice}
            disabled={loading}
          />
        )}
      </div>
    </div>
  )
}
