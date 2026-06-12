import React from 'react'

import happyCharacter from '../character/girl_happy_02.png'
import idleCharacter from '../character/girl_idle_01.png'
import thinkingCharacter from '../character/girl_idle_03.png'
import listeningCharacter from '../character/girl_shock.png'
import '../styles/avatar.css'

const avatarStates = {
  idle: {
    caption: '我准备好了，随时可以和你聊聊。',
    image: idleCharacter,
    label: '待机',
  },
  listening: {
    caption: '我在认真听，请继续说。',
    image: listeningCharacter,
    label: '倾听',
  },
  thinking: {
    caption: '让我想一想，很快就有答案。',
    image: thinkingCharacter,
    label: '思考',
  },
  talking: {
    caption: '正在为你回答。',
    image: happyCharacter,
    label: '说话',
  },
}

function Avatar({ state = 'idle' }) {
  const currentState = avatarStates[state] || avatarStates.idle

  return (
    <section
      className={`avatar-stage avatar-state-${state}`}
      aria-label="AI 角色区域"
      data-avatar-state={state}
    >
      <div className="avatar-heading">
        <div>
          <p className="panel-kicker">Your companion</p>
          <h2>露米娅</h2>
        </div>
        <span className={`badge avatar-state-badge avatar-state-badge-${state}`}>
          <span className="status-dot" aria-hidden="true" />
          {state}
        </span>
      </div>

      <div className="avatar-visual">
        <div className="avatar-orbit avatar-orbit-large" />
        <div className="avatar-orbit avatar-orbit-small" />
        <div className="avatar-glow" />
        <div className="avatar-state-effect" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <img
          key={state}
          className="avatar-character"
          src={currentState.image}
          alt={`AI 角色露米娅，当前处于${currentState.label}状态`}
        />
      </div>

      <div className="avatar-caption">
        <span className="caption-line" aria-hidden="true" />
        <p>
          <strong>{currentState.label}</strong>
          {currentState.caption}
        </p>
        <span className="caption-line" aria-hidden="true" />
      </div>
    </section>
  )
}

export default Avatar
