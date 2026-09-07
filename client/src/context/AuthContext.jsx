import { useCallback, useEffect, useState } from 'react'
import { accountApi, clearStoredToken, getStoredToken, storeToken } from '../lib/accountApi'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!getStoredToken()) { setProfile(null); return null }
    const data = await accountApi.getProfile()
    setProfile(data.profile)
    return data.profile
  }, [])

  useEffect(() => {
    let active = true
    async function restore() {
      if (!getStoredToken()) { setLoading(false); return }
      try {
        const [accountData, profileData] = await Promise.all([accountApi.me(), accountApi.getProfile()])
        if (!active) return
        setUser(accountData.user)
        setProfile(profileData.profile)
      } catch { if (active) { clearStoredToken(); setUser(null); setProfile(null) } }
      finally { if (active) setLoading(false) }
    }
    restore()
    return () => { active = false }
  }, [])

  async function signIn({ email, password }) {
    try {
      const data = await accountApi.login({ email, password })
      acceptSession(data)
      const profileData = await accountApi.getProfile()
      setProfile(profileData.profile)
      return { data: { session: data.token, user: data.user }, error: null }
    } catch (error) { return { data: null, error } }
  }

  async function signUp({ email, password, options }) {
    try {
      const data = await accountApi.register({ email, password, fullName: options?.data?.full_name || '' })
      acceptSession(data)
      setProfile(null)
      return { data: { session: data.token, user: data.user }, error: null }
    } catch (error) { return { data: null, error } }
  }

  function acceptSession(data) {
    storeToken(data.token)
    setUser(data.user)
  }

  function signOut() {
    clearStoredToken()
    setUser(null); setProfile(null)
  }

  const value = { user, session: user ? true : null, profile, loading, signIn, signUp, signOut, refreshProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
