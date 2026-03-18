// frontend/src/components/PasswordGate.tsx
// Drop this component into any page to require demo password

import { useState } from 'react'
import './PasswordGate.css'

const DEMO_PASSWORD = 'helpiq2024'

interface Props {
  pageName: string
  icon: string
  children: React.ReactNode
}

export default function PasswordGate({ pageName, icon, children }: Props) {
  const [ok, setOk]         = useState(false)
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState('')
  const [shaking, setShake] = useState(false)

  const submit = () => {
    if (pw === DEMO_PASSWORD) {
      setOk(true)
    } else {
      setError('Wrong password. Try again.')
      setPw('')
      // Shake animation
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  if (ok) return <>{children}</>

  return (
    <div className="pw-gate-page">
      <div className={`pw-gate-card ${shaking ? 'shake' : ''}`}>
        <div className="pw-gate-icon">{icon}</div>
        <h2>{pageName}</h2>
        <p>Enter the demo password to access this section</p>
        <input
          className="pw-gate-input"
          type="password"
          placeholder="Password..."
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />
        {error && <div className="pw-gate-error">{error}</div>}
        <button className="pw-gate-btn" onClick={submit}>Unlock →</button>
        <div className="pw-gate-hint">Demo password: <code>helpiq2024</code></div>
      </div>
    </div>
  )
}
