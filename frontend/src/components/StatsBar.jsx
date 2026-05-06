import React from 'react'

export default function StatsBar({ stats }) {
  return (
    <div className="stats-container">
      <div className="stat-bar">
        <span className="stat-label">Public Trust</span>
        <span className="stat-value">{stats.trust}</span>
        <div style={{ width: '100px', height: '8px', background: '#444', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.trust}%`, height: '100%', background: '#4CAF50', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
      <div className="stat-bar">
        <span className="stat-label">Economy</span>
        <span className="stat-value">{stats.economy}</span>
        <div style={{ width: '100px', height: '8px', background: '#444', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.economy}%`, height: '100%', background: '#2196F3', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
      <div className="stat-bar">
        <span className="stat-label">Chaos</span>
        <span className="stat-value">{stats.chaos}</span>
        <div style={{ width: '100px', height: '8px', background: '#444', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.chaos}%`, height: '100%', background: '#FF6B6B', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
    </div>
  )
}
