import React from 'react'

export default function VerdictButtons({ choices, onChoice, disabled }) {
  return (
    <div className="verdict-buttons">
      {choices.map((choice) => (
        <button
          key={choice.text}
          className="verdict-button"
          onClick={() => onChoice(choice)}
          disabled={disabled}
          title={`Verdict: ${choice.text}`}
        >
          {choice.text}
        </button>
      ))}
    </div>
  )
}
