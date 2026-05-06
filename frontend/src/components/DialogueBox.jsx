import React from 'react'

export default function DialogueBox({ character, text }) {
  return (
    <div className="dialogue-box">
      <div className="dialogue-character">{character}</div>
      <p className="dialogue-text">{text}</p>
    </div>
  )
}
