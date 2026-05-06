import { initializeApp, getApp, getApps } from 'firebase/app'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const storageKey = 'judges-court:profile'

const defaultStats = {
  trust: 50,
  economy: 50,
  chaos: 50,
}

const defaultProgress = {
  caseIndex: 0,
  history: [],
}

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
}

function getFirebaseApp() {
  if (!hasFirebaseConfig()) return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

const app = getFirebaseApp()
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null
const provider = auth ? new GoogleAuthProvider() : null

if (provider) {
  provider.setCustomParameters({ prompt: 'select_account' })
}

export function isFirebaseReady() {
  return Boolean(auth && db)
}

export function createDefaultJudgeState() {
  return {
    username: 'Guest Judge',
    photoURL: '',
    stats: { ...defaultStats },
    progress: {
      ...defaultProgress,
      history: [],
    },
  }
}

function normalizeJudgeState(inputState) {
  const safeState = inputState || {}
  const safeStats = safeState.stats || {}
  const safeProgress = safeState.progress || {}

  return {
    ...createDefaultJudgeState(),
    ...safeState,
    stats: {
      trust: Number.isFinite(safeStats.trust) ? safeStats.trust : defaultStats.trust,
      economy: Number.isFinite(safeStats.economy) ? safeStats.economy : defaultStats.economy,
      chaos: Number.isFinite(safeStats.chaos) ? safeStats.chaos : defaultStats.chaos,
    },
    progress: {
      caseIndex: Number.isFinite(safeProgress.caseIndex) ? safeProgress.caseIndex : defaultProgress.caseIndex,
      history: Array.isArray(safeProgress.history) ? safeProgress.history.slice(0, 20) : [],
    },
  }
}

function readLocalProfile() {
  if (typeof window === 'undefined') return createDefaultJudgeState()

  try {
    const rawProfile = window.localStorage.getItem(storageKey)
    if (!rawProfile) return createDefaultJudgeState()
    return normalizeJudgeState(JSON.parse(rawProfile))
  } catch {
    return createDefaultJudgeState()
  }
}

function writeLocalProfile(profile) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizeJudgeState(profile)))
  } catch {
    // localStorage is best-effort only.
  }
}

export function subscribeToAuthState(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function signInWithGoogle() {
  if (!auth || !provider) {
    throw new Error('Firebase is not configured for Google login.')
  }

  const result = await signInWithPopup(auth, provider)
  const user = result.user
  const savedProfile = await loadJudgeState(user.uid)
  const mergedProfile = normalizeJudgeState({
    ...savedProfile,
    username: user.displayName || savedProfile.username,
    photoURL: user.photoURL || savedProfile.photoURL,
  })

  await saveJudgeState(user.uid, mergedProfile)
  return user
}

export async function signOutUser() {
  if (auth) {
    await signOut(auth)
  }
}

export async function loadJudgeState(userId) {
  if (!db || !userId) {
    return readLocalProfile()
  }

  try {
    const snapshot = await getDoc(doc(db, 'users', userId))
    if (!snapshot.exists()) {
      return readLocalProfile()
    }

    return normalizeJudgeState(snapshot.data())
  } catch {
    return readLocalProfile()
  }
}

export async function saveJudgeState(userId, profile) {
  const nextProfile = normalizeJudgeState(profile)

  if (!db || !userId) {
    writeLocalProfile(nextProfile)
    return nextProfile
  }

  await setDoc(
    doc(db, 'users', userId),
    {
      ...nextProfile,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return nextProfile
}

export function loadLocalJudgeState() {
  return readLocalProfile()
}