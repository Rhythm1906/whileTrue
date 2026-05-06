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
import Courtroom from './components/Courtroom.jsx'
import './styles/game.css'

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
    <Courtroom
      currentCase={currentCase}
      stats={profile.stats}
      profile={profile}
      onChoice={handleChoice}
      loading={loadingCase}
      error={error}
    />
  )
}
