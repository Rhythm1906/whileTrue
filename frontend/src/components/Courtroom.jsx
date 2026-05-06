import React from 'react'
import DialogueBox from './DialogueBox.jsx'
import VerdictButtons from './VerdictButtons.jsx'
import StatsBar from './StatsBar.jsx'

export default function Courtroom({ currentCase, stats, profile, onChoice, loading, error }) {
  // Character images - Update these paths based on where you store your assets
  const characterImages = {
    judge: '/judges-court/assets/judge.png',
    defendant: '/judges-court/assets/defendant.png',
    attorney: '/judges-court/assets/attorney.png',
    courtroom: '/judges-court/assets/courtroom-scene.png',
  }

  return (
    <div className="courtroom-container">
      <div className="courtroom-scene has-image">
        {/* Judge Portrait */}
        <div 
          className="judge-portrait"
          style={{ backgroundImage: `url('${characterImages.judge}')` }}
        />
        
        {/* Defendant Portrait */}
        <div 
          className="defendant-portrait"
          style={{ backgroundImage: `url('${characterImages.defendant}')` }}
        />
        
        {/* Attorney Portrait */}
        <div 
          className="attorney-portrait"
          style={{ backgroundImage: `url('${characterImages.attorney}')` }}
        />

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
