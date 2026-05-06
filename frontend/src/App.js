import React, { useEffect, useState } from 'react'
import {
  createDefaultJudgeState,
  isFirebaseReady,
  loadJudgeState,
  saveJudgeState,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
} from './firebase'
import { fetchCourtCase } from './api'

function applyEffects(stats, effects) {
  return {
    trust: Math.max(0, Math.min(100, stats.trust + (effects.trust || 0))),
    economy: Math.max(0, Math.min(100, stats.economy + (effects.economy || 0))),
    chaos: Math.max(0, Math.min(100, stats.chaos + (effects.chaos || 0))),
  }
}

function profileLabel(user, profile) {
  return user?.displayName || profile.username || 'Guest Judge'
}

export default function App() {
  const [authUser, setAuthUser] = useState(null)
  const [profile, setProfile] = useState(createDefaultJudgeState())
  const [draftUsername, setDraftUsername] = useState(profile.username)
  const [currentCase, setCurrentCase] = useState(null)
  const [loadingCase, setLoadingCase] = useState(true)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!active) return

      setAuthUser(user)
      const storedProfile = await loadJudgeState(user?.uid)

      if (!active) return

      const nextProfile = {
        ...createDefaultJudgeState(),
        ...storedProfile,
        username: user?.displayName || storedProfile.username,
        photoURL: user?.photoURL || storedProfile.photoURL,
      }

      setProfile(nextProfile)
      setDraftUsername(nextProfile.username)
      setLoadingAuth(false)
    })

    return () => {
      active = false
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCase() {
      setLoadingCase(true)
      setError('')

      try {
        const nextCase = await fetchCourtCase()
        if (active) setCurrentCase(nextCase)
      } catch (caseError) {
        if (active) setError(caseError.message || 'Unable to load the next case.')
      } finally {
        if (active) setLoadingCase(false)
      }
    }

    loadCase()

    return () => {
      active = false
    }
  }, [])

  async function persistProfile(nextProfile) {
    setSaving(true)
    setError('')

    try {
      await saveJudgeState(authUser?.uid, nextProfile)
      setProfile(nextProfile)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save progress.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChoice(choice) {
    if (!currentCase) return

    const nextStats = applyEffects(profile.stats, choice.effects || {})
    const nextProfile = {
      ...profile,
      username: draftUsername.trim() || profileLabel(authUser, profile),
      stats: nextStats,
      progress: {
        caseIndex: (profile.progress.caseIndex || 0) + 1,
        history: [
          {
            character: currentCase.character,
            text: currentCase.text,
            choice: choice.text,
            effects: choice.effects || {},
            at: new Date().toISOString(),
          },
          ...(profile.progress.history || []),
        ].slice(0, 20),
      },
    }

    await persistProfile(nextProfile)
    setLoadingCase(true)

    try {
      setCurrentCase(await fetchCourtCase())
    } catch (caseError) {
      setError(caseError.message || 'Unable to load the next case.')
    } finally {
      setLoadingCase(false)
    }
  }

  async function handleSaveUsername() {
    const nextProfile = {
      ...profile,
      username: draftUsername.trim() || profileLabel(authUser, profile),
    }

    await persistProfile(nextProfile)
  }

  async function handleReloadProgress() {
    const storedProfile = await loadJudgeState(authUser?.uid)
    setProfile(storedProfile)
    setDraftUsername(storedProfile.username)
  }

  async function handleSignIn() {
    setError('')
    try {
      const user = await signInWithGoogle()
      setAuthUser(user)
    } catch (signInError) {
      setError(signInError.message || 'Google sign-in failed.')
    }
  }

  async function handleSignOut() {
    await signOutUser()
    setAuthUser(null)
    const guestProfile = createDefaultJudgeState()
    setProfile(guestProfile)
    setDraftUsername(guestProfile.username)
  }

  const activeUsername = profileLabel(authUser, profile)
  const activePhoto = authUser?.photoURL || profile.photoURL

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ marginBottom: 24 }}>
        <h1>Judges Court</h1>
        <p>
          AI-generated cases with Firebase-backed progress saving and a local fallback when the API is unavailable.
        </p>
        <p style={{ opacity: 0.8 }}>
          Firebase: {isFirebaseReady() ? 'configured' : 'demo fallback only'}
        </p>
      </section>

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h2>Profile</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            {activePhoto ? (
              <img src={activePhoto} alt={activeUsername} width="48" height="48" style={{ borderRadius: '50%' }} />
            ) : (
              <div
                aria-label="Profile placeholder"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#222',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                J
              </div>
            )}
            <div>
              <div>{activeUsername}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Case progress: {profile.progress.caseIndex || 0}</div>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Username
            <input
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              onBlur={handleSaveUsername}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
            />
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={handleSaveUsername} disabled={saving}>
              Save Profile
            </button>
            <button onClick={handleReloadProgress} disabled={saving || loadingAuth}>
              Reload Save
            </button>
            {authUser ? (
              <button onClick={handleSignOut} disabled={saving}>
                Log Out
              </button>
            ) : (
              <button onClick={handleSignIn} disabled={!isFirebaseReady() || saving}>
                Google Log In
              </button>
            )}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h2>Stats</h2>
          <div>Public Trust: {profile.stats.trust}</div>
          <div>Economy: {profile.stats.economy}</div>
          <div>Chaos: {profile.stats.chaos}</div>
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            Saving status: {saving ? 'Saving...' : 'Idle'}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24, border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
        <h2>Case</h2>
        {loadingCase ? (
          <p>Loading the next case...</p>
        ) : currentCase ? (
          <>
            <p><strong>{currentCase.character}</strong></p>
            <p>{currentCase.text}</p>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              {currentCase.choices.map((choice) => (
                <button key={choice.text} onClick={() => handleChoice(choice)} disabled={saving}>
                  {choice.text}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>No case available.</p>
        )}
      </section>

      {error ? (
        <p role="alert" style={{ marginTop: 16, color: '#b00020' }}>
          {error}
        </p>
      ) : null}
    </main>
  )
}
